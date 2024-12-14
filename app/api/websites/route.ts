import { NextResponse } from "next/server";
import type { Website } from "@/lib/types";
import { AjaxResponse } from "@/lib/types";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/websites
// 获取所有指定分类的网站
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = (searchParams.get("status") as Website["status"]) || "approved";
  const websites = await prisma.website.findMany({
    where: { status: status === "all" ? undefined : status },
  });
  return NextResponse.json(AjaxResponse.ok(websites));
}

// POST /api/websites
// 创建网站
export async function POST(request: Request) {
  if (!request.body) {
    return NextResponse.json(AjaxResponse.fail("Request body is required"), {
      status: 400,
    });
  }

  try {
    const data = await request.json();

    // Validate required fields
    if (!data.title || !data.url || !data.category_id) {
      return NextResponse.json(
        AjaxResponse.fail(
          "Missing required fields: title, url, or category_id"
        ),
        { status: 400 }
      );
    }

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: Number(data.category_id) },
    });

    if (!category) {
      return NextResponse.json(AjaxResponse.fail("Category does not exist"), {
        status: 400,
      });
    }

    const website = await prisma.website.create({
      data: {
        title: data.title,
        url: data.url,
        description: data.description || "",
        category_id: Number(data.category_id),
        thumbnail: data.thumbnail || "",
        status: data.status || "pending",
      },
    });

    return NextResponse.json(AjaxResponse.ok(website));
  } catch (error) {
    console.error("Failed to create website:", error);
    return NextResponse.json(AjaxResponse.fail("Failed to create website"), {
      status: 500,
    });
  }
}