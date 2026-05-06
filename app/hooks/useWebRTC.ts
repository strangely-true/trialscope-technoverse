/**
 * useWebRTC — shared hook for in-browser WebRTC audio calling via signaling relay.
 * Works for both coordinator (caller) and patient (callee).
 */
"use client"
import { useCallback, useEffect, useRef, useState } from "react"

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
}

export type CallState = "idle" | "connecting" | "ringing" | "active" | "ended" | "error"

export function useWebRTC(roomId: string | null) {
  const [callState, setCallState] = useState<CallState>("idle")
  const [error, setError] = useState<string | null>(null)
  const [duration, setDuration] = useState(0)

  const pcRef = useRef<RTCPeerConnection | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const isCallerRef = useRef(false)

  const getApiBase = () => {
    const url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
    return url.replace(/^https?:\/\//, "")
  }

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop())
      localStreamRef.current = null
    }
    if (pcRef.current) {
      pcRef.current.close()
      pcRef.current = null
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null
    }
    setDuration(0)
  }, [])

  const sendSignal = useCallback((msg: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg))
    }
  }, [])

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(ICE_SERVERS)

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        sendSignal({ type: "ice", candidate: e.candidate })
      }
    }

    pc.ontrack = (e) => {
      if (!remoteAudioRef.current) {
        remoteAudioRef.current = new Audio()
        remoteAudioRef.current.autoplay = true
      }
      remoteAudioRef.current.srcObject = e.streams[0]
      setCallState("active")
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000)
    }

    pc.oniceconnectionstatechange = () => {
      if (["failed", "disconnected", "closed"].includes(pc.iceConnectionState)) {
        setCallState("ended")
        cleanup()
      }
    }

    return pc
  }, [sendSignal, cleanup])

  /** Caller side: connect signaling, get mic, create offer */
  const startCall = useCallback(async () => {
    if (!roomId) return
    setCallState("connecting")
    setError(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      localStreamRef.current = stream

      const proto = window.location.protocol === "https:" ? "wss:" : "ws:"
      const ws = new WebSocket(`${proto}//${getApiBase()}/ws/call/${roomId}`)
      wsRef.current = ws
      isCallerRef.current = true

      const pc = createPeerConnection()
      pcRef.current = pc
      stream.getTracks().forEach(t => pc.addTrack(t, stream))

      ws.onopen = async () => {
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        sendSignal({ type: "offer", sdp: pc.localDescription })
        setCallState("ringing")
      }

      ws.onmessage = async (e) => {
        const msg = JSON.parse(e.data)
        if (msg.type === "answer") {
          await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp))
        } else if (msg.type === "ice") {
          try { await pc.addIceCandidate(new RTCIceCandidate(msg.candidate)) } catch {}
        } else if (msg.type === "peer_left") {
          setCallState("ended")
          cleanup()
        }
      }

      ws.onerror = () => { setError("Connection error"); setCallState("error"); cleanup() }
    } catch (err: any) {
      setError(err.message || "Microphone access denied")
      setCallState("error")
      cleanup()
    }
  }, [roomId, createPeerConnection, sendSignal, cleanup])

  /** Callee side: answer an incoming call */
  const answerCall = useCallback(async () => {
    if (!roomId) return
    setCallState("connecting")
    setError(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      localStreamRef.current = stream

      const proto = window.location.protocol === "https:" ? "wss:" : "ws:"
      const ws = new WebSocket(`${proto}//${getApiBase()}/ws/call/${roomId}`)
      wsRef.current = ws
      isCallerRef.current = false

      const pc = createPeerConnection()
      pcRef.current = pc
      stream.getTracks().forEach(t => pc.addTrack(t, stream))

      ws.onmessage = async (e) => {
        const msg = JSON.parse(e.data)
        if (msg.type === "offer") {
          await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp))
          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)
          sendSignal({ type: "answer", sdp: pc.localDescription })
        } else if (msg.type === "ice") {
          try { await pc.addIceCandidate(new RTCIceCandidate(msg.candidate)) } catch {}
        } else if (msg.type === "peer_left") {
          setCallState("ended")
          cleanup()
        }
      }

      ws.onerror = () => { setError("Connection error"); setCallState("error"); cleanup() }
    } catch (err: any) {
      setError(err.message || "Microphone access denied")
      setCallState("error")
      cleanup()
    }
  }, [roomId, createPeerConnection, sendSignal, cleanup])

  const endCall = useCallback(() => {
    sendSignal({ type: "peer_left" })
    setCallState("ended")
    cleanup()
  }, [sendSignal, cleanup])

  // Cleanup on unmount
  useEffect(() => () => { cleanup() }, [cleanup])

  const formatDuration = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`

  return { callState, error, duration: formatDuration(duration), startCall, answerCall, endCall }
}
