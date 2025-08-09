import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

interface PostMeta {
  title: string;
  date: string;
  author: string;
  slug: string;
  description: string;
}

const POSTS_DIR = path.join(process.cwd(), 'content', 'news');

async function getPostBySlug(slug: string) {
  const filePath = path.join(POSTS_DIR, `${slug}.mdx`);
  try {
    const source = await fs.readFile(filePath, 'utf8');
    const { data } = matter(source);
    return data as PostMeta;
  } catch (err) {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const meta = await getPostBySlug(slug);
  if (!meta) {
    return {};
  }
  return {
    title: meta.title,
    description: meta.description,
  };
}

export async function generateStaticParams() {
  const files = await fs.readdir(POSTS_DIR);
  return files
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => ({ slug: f.replace(/\.mdx$/, '') }));
}

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const Post = (await import(`@/content/news/${slug}.mdx`)).default;
    return (
      <article className="prose dark:prose-invert max-w-none">
        <Post />
      </article>
    );
  } catch (err) {
    notFound();
  }
}