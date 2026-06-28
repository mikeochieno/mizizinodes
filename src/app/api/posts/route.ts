import { getAllPosts } from "@/lib/posts";

export async function GET() {
  return Response.json(getAllPosts());
}
