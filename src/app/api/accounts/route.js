import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accounts = await prisma.account.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        accountId: true,
        providerId: true,
        accessToken: true,
        refreshToken: true,
        idToken: true,
        accessTokenExpiresAt: true,
        refreshTokenExpiresAt: true,
        scope: true,
        password: true,
        syncFolderId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ data: accounts }, { status: 200 });
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return NextResponse.json(
      { error: "Failed to fetch accounts" },
      { status: 500 }
    );
  }
}
