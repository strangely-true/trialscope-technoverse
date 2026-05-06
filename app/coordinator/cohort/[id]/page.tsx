"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageTransition } from "@/components/ui/page-transition";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { ArrowLeft, Phone, Mail, User, AlertTriangle, TrendingDown, Activity, Heart, Watch } from "lucide-react";
import { toast } from "sonner";

interface PatientProfile {
    patient: {
        id: number;
        hash_id: string;
        trial_id: number;
        match_score: number;
        status: string;
        enrolled_at: string;
        phone_number: string | null;
        full_name: string | null;
        email: string | null;
    };
    consent: {
        id: number | null;
        signed_at: string | null;
        signed_pdf_url: string | null;
        template_name: string | null;
        template_version: number | null;
    };
    dropout_scores: Array<{
        score: number;
        risk_tier: string;
        scored_at: string;
    }>;
    anomaly_alerts: Array<{
        biometric: string;
        value: number;
        z_score: number;
        tier: string;
        resolved: boolean;
        created_at: string;
    }>;
    symptom_logs: Array<{
        symptoms: Record<string, any>;
        severity: string;
        logged_at: string;
    }>;
    wearable_data: Array<{
        heart_rate: number | null;
        glucose: number | null;
        steps: number | null;
        temperature: number | null;
        recorded_at: string;
    }>;
}

const RISK_COLORS: Record<string, string> = {
    RED: "#EF4444",
    AMBER: "#F59E0B",
    GREEN: "#10B981",
};

const RISK_BADGE_VARIANTS: Record<string, "default" | "destructive" | "secondary"> = {
    RED: "destructive",
    AMBER: "secondary",
    GREEN: "default",
};

export default function PatientDetailPage() {
    const params = useParams();
    const patientId = params.id as string;
    const [profile, setProfile] = useState<PatientProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("trialgo_token");
        if (!token || !patientId) return;

        fetch(`/api/coordinator/patient/${patientId}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.ok ? r.json() : null)
            .then((data) => setProfile(data))
            .catch(() => toast.error("Failed to load patient profile"))
            .finally(() => setLoading(false));
    }, [patientId]);

    if (loading) {
        return (
            <PageTransition>
                <div className="space-y-6">
                    <Skeleton className="h-10 w-24" />
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
                    </div>
                </div>
            </PageTransition>
        );
    }

    if (!profile) {
        return (
            <PageTransition>
                <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-900 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                    <p className="font-semibold">Patient not found</p>
                    <Link href="/coordinator/cohort" className="mt-2 inline-flex items-center gap-2 text-blue-600 hover:underline dark:text-blue-400">
                        <ArrowLeft className="h-4 w-4" /> Back to Cohort
                    </Link>
                </div>
            </PageTransition>
        );
    }

    const latestDropout = profile.dropout_scores[0];
    const unresolved = profile.anomaly_alerts.filter((a) => !a.resolved);
    const dropoutHistory = profile.dropout_scores.slice(0, 10).reverse().map((s, i) => ({
        day: i,
        score: s.score * 100,
        tier: s.risk_tier,
    }));

    return (
        <PageTransition>
            <div>
                {/* Header with back button */}
                <div className="mb-6 flex items-center gap-3">
                    <Link
                        href="/coordinator/cohort"
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            {profile.patient.full_name || `Patient ${profile.patient.id}`}
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            ID: {profile.patient.hash_id.substring(0, 16)}...
                        </p>
                    </div>
                </div>

                {/* Contact Info */}
                <div className="mb-6 grid gap-4 md:grid-cols-3">
                    {profile.patient.phone_number && (
                        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                            <Phone className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Phone</p>
                                <p className="font-medium text-slate-900 dark:text-white">{profile.patient.phone_number}</p>
                            </div>
                        </div>
                    )}
                    {profile.patient.email && (
                        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                            <Mail className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Email</p>
                                <p className="truncate font-medium text-slate-900 dark:text-white">{profile.patient.email}</p>
                            </div>
                        </div>
                    )}
                    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                        <User className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Status</p>
                            <Badge variant="outline" className="capitalize mt-1 text-xs">
                                {profile.patient.status}
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Dropout Risk Section */}
                {latestDropout && (
                    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <TrendingDown className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Dropout Risk</h2>
                            </div>
                            <Badge variant={RISK_BADGE_VARIANTS[latestDropout.risk_tier]}>
                                {latestDropout.risk_tier}
                            </Badge>
                        </div>

                        <div className="mb-4 grid gap-4 md:grid-cols-3">
                            <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-700">
                                <p className="text-xs text-slate-500 dark:text-slate-400">Dropout Score</p>
                                <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                                    {(latestDropout.score * 100).toFixed(0)}%
                                </p>
                            </div>
                            <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-700">
                                <p className="text-xs text-slate-500 dark:text-slate-400">Last Updated</p>
                                <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
                                    {new Date(latestDropout.scored_at).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-700">
                                <p className="text-xs text-slate-500 dark:text-slate-400">Match Score</p>
                                <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                                    {(profile.patient.match_score * 100).toFixed(0)}%
                                </p>
                            </div>
                        </div>

                        {dropoutHistory.length > 1 && (
                            <div className="mt-4">
                                <p className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">Risk Trend (Last 10 Scores)</p>
                                <ChartContainer config={{ score: { label: "Score %", color: "#3B82F6" } }} className="h-48 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={dropoutHistory}>
                                            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                                            <XAxis dataKey="day" tick={{ fontSize: 12 }} className="text-slate-500 dark:text-slate-400" />
                                            <YAxis tick={{ fontSize: 12 }} className="text-slate-500 dark:text-slate-400" domain={[0, 100]} />
                                            <ChartTooltip content={<ChartTooltipContent />} />
                                            <Line
                                                type="monotone"
                                                dataKey="score"
                                                stroke="#3B82F6"
                                                dot={{ r: 4 }}
                                                strokeWidth={2}
                                                isAnimationActive={false}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </ChartContainer>
                            </div>
                        )}
                    </div>
                )}

                {/* Engagement Metrics */}
                {profile.wearable_data.length > 0 && (
                    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                        <div className="mb-4 flex items-center gap-2">
                            <Activity className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Latest Wearable Data</h2>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            {profile.wearable_data[0]?.heart_rate && (
                                <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-700">
                                    <div className="flex items-center gap-2">
                                        <Heart className="h-4 w-4 text-red-600 dark:text-red-400" />
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Heart Rate</p>
                                    </div>
                                    <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                                        {profile.wearable_data[0].heart_rate} bpm
                                    </p>
                                </div>
                            )}
                            {profile.wearable_data[0]?.glucose && (
                                <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-700">
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Glucose</p>
                                    <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                                        {profile.wearable_data[0].glucose} mg/dL
                                    </p>
                                </div>
                            )}
                            {profile.wearable_data[0]?.steps && (
                                <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-700">
                                    <div className="flex items-center gap-2">
                                        <Watch className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Steps</p>
                                    </div>
                                    <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                                        {profile.wearable_data[0].steps?.toLocaleString()}
                                    </p>
                                </div>
                            )}
                            {profile.wearable_data[0]?.temperature && (
                                <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-700">
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Temperature</p>
                                    <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                                        {profile.wearable_data[0].temperature}°F
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Anomalies */}
                {unresolved.length > 0 && (
                    <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
                        <div className="mb-4 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                            <h2 className="text-lg font-semibold text-red-900 dark:text-red-400">{unresolved.length} Unresolved Anomalies</h2>
                        </div>

                        <div className="space-y-3">
                            {unresolved.map((alert) => (
                                <div
                                    key={`${alert.biometric}-${alert.created_at}`}
                                    className="rounded-lg border border-red-300 bg-white p-4 dark:border-red-700 dark:bg-slate-800"
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="font-medium text-slate-900 dark:text-white">{alert.biometric}</p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                Value: {alert.value?.toFixed(2) || "N/A"} (Z-score: {alert.z_score?.toFixed(2) || "N/A"})
                                            </p>
                                            <p className="text-xs text-slate-400 dark:text-slate-500">
                                                {new Date(alert.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <Badge variant={RISK_BADGE_VARIANTS[alert.tier]}>{alert.tier}</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Consent */}
                {profile.consent.id && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Consent</h2>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Template</p>
                                <p className="mt-1 font-medium text-slate-900 dark:text-white">
                                    {profile.consent.template_name} v{profile.consent.template_version}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Signed</p>
                                <p className="mt-1 font-medium text-slate-900 dark:text-white">
                                    {new Date(profile.consent.signed_at || "").toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </PageTransition>
    );
}
