import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface PostMeta {
  title: string;
  date: string;
  author: string;
  slug: string;
  description: string;
  previewText: string;
}

const POSTS_DIR = path.join(process.cwd(), 'content', 'news');
const POSTS_PER_PAGE = 5;

async function getAllPosts(): Promise<PostMeta[]> {
  const files = await fs.readdir(POSTS_DIR);
  const posts: PostMeta[] = [];
  for (const file of files) {
    if (!file.endsWith('.mdx')) continue;
    const filePath = path.join(POSTS_DIR, file);
    const raw = await fs.readFile(filePath, 'utf8');
    const { data } = matter(raw);
    posts.push(data as PostMeta);
  }
  // Sort descending by date
  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export default async function NewsPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const page = parseInt(searchParams.page ?? '1', 10);
  if (page < 1) {
    notFound();
  }
  const posts = await getAllPosts();
  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);
  if (page > totalPages && totalPages !== 0) {
    notFound();
  }
  const start = (page - 1) * POSTS_PER_PAGE;
  const paginated = posts.slice(start, start + POSTS_PER_PAGE);

  return (
    <section className="space-y-8">
      <h1 className="text-3xl font-semibold">News</h1>
      <ul className="space-y-6">
        {paginated.map((post) => (
          <li key={post.slug} className="border-b pb-4">
            <h2 className="text-xl font-medium">
              <Link href={`/news/${post.slug}`} className="hover:underline">
                {post.title}
              </Link>
            </h2>
            <p className="text-sm text-mutedForeground mb-2">
              {new Date(post.date).toLocaleDateString()} — {post.author}
            </p>
            <p>{post.previewText}</p>
          </li>
        ))}
      </ul>
      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="flex justify-center gap-4">
          {Array.from({ length: totalPages }).map((_, idx) => {
            const idxPage = idx + 1;
            const isCurrent = idxPage === page;
            return (
              <Link
                key={idxPage}
                href={`/news?page=${idxPage}`}
                className={
                  isCurrent
                    ? 'font-bold underline'
                    : 'text-mutedForeground hover:underline'
                }
              >
                {idxPage}
              </Link>
            );
          })}
        </nav>
      )}
    </section>
  );
}