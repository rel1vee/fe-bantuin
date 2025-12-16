"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Eye } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminDisputesPage() {
    const [disputes, setDisputes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        fetchDisputes();
    }, []);

    const fetchDisputes = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("access_token");
            // Use standard AdminService endpoint for OPEN disputes
            const res = await fetch("/api/admin/disputes/open", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setDisputes(data.data || []);
            }
        } catch (error) {
            console.error("Error", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold font-display">Sengketa (Disputes)</h1>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Daftar Sengketa Aktif (Open)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID Sengketa</TableHead>
                                    <TableHead>Order</TableHead>
                                    <TableHead>Pelapor</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8">
                                            Loading...
                                        </TableCell>
                                    </TableRow>
                                ) : disputes.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            Tidak ada sengketa aktif.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    disputes.map((dispute) => (
                                        <TableRow key={dispute.id}>
                                            <TableCell className="font-mono text-xs">
                                                {dispute.id.substring(0, 8)}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                <span className="font-mono text-xs">{dispute.order?.id?.substring(0, 8)}</span>
                                                <br />
                                                <span className="text-xs text-muted-foreground">{dispute.order?.title}</span>
                                            </TableCell>
                                            <TableCell>
                                                {dispute.openedBy?.fullName || "User"}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="destructive">
                                                    {dispute.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {new Date(dispute.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <Link href={`/admin/disputes/${dispute.id}`}>
                                                    <Button size="sm" variant="outline">
                                                        <Eye className="h-4 w-4 mr-1" /> Detail
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
