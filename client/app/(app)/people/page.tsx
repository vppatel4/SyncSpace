"use client";

import Link from "next/link";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { BookUser } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useGetUsersQuery } from "@/store/api/syncspaceApi";

export default function PeoplePage() {
  const { data, isLoading } = useGetUsersQuery();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">People</h1>
          <p className="text-sm text-muted-foreground">
            All SyncSpace accounts in this database — total{" "}
            <Badge variant="secondary" className="mx-0.5">
              {data?.total ?? "—"}
            </Badge>{" "}
            {data?.total === 1 ? "user" : "users"}.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BookUser className="h-5 w-5 text-primary" />
          <span>Directory</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Accounts</CardTitle>
          <CardDescription>Everyone who can sign in to this workspace (seeded + registered).</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          )}
          {!isLoading && data && (
            <ul className="divide-y divide-border rounded-xl border border-border">
              {data.users.map((u, idx) => (
                <motion.li
                  key={u.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-11 w-11">
                      <AvatarImage src={u.image ?? undefined} alt={u.name} />
                      <AvatarFallback>{u.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{u.name}</p>
                      <p className="text-sm text-muted-foreground">@{u.username}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-start gap-1 sm:items-end">
                    <span className="text-sm text-muted-foreground">{u.email}</span>
                    <span className="text-xs text-muted-foreground">
                      Joined {u.createdAt ? format(new Date(u.createdAt), "MMM d, yyyy") : "—"}
                    </span>
                    <ButtonLink href={`/users/${u.id}`} />
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ButtonLink({ href }: { href: string }) {
  return (
    <Link href={href} className="text-xs font-medium text-primary hover:underline">
      View profile
    </Link>
  );
}
