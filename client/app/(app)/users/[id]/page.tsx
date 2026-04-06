"use client";

import { useParams } from "next/navigation";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetUserQuery } from "@/store/api/syncspaceApi";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function UserProfilePage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const { data, isLoading } = useGetUserQuery(id, { skip: !id });
  const { data: session } = useSession();
  const user = data?.user;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (!user) {
    return <p className="text-sm text-muted-foreground">User not found.</p>;
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center gap-4 space-y-0">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.image ?? undefined} />
            <AvatarFallback className="text-lg">{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>{user.name}</CardTitle>
            <CardDescription>@{user.username}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Email: </span>
            {user.email}
          </p>
          {user.createdAt && (
            <p>
              <span className="text-muted-foreground">Member since </span>
              {format(new Date(user.createdAt), "MMMM yyyy")}
            </p>
          )}
          {session?.user?.id === user.id && (
            <Button asChild variant="outline" className="mt-4">
              <Link href="/settings">Edit in settings</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
