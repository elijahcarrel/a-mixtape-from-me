import type { MDXComponents } from 'mdx/types';
import Link from 'next/link';

// Common Tailwind utility classes for typography
const baseHeading = 'font-semibold text-gray-900 dark:text-gray-100';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Headings
    h1: ({ children, ...props }) => (
      <h1 className={`text-3xl ${baseHeading} mb-6`} {...props}>
        {children}
      </h1>
    ),
    h2: ({ children, ...props }) => (
      <h2 className={`text-2xl ${baseHeading} mt-8 mb-4`} {...props}>
        {children}
      </h2>
    ),
    h3: ({ children, ...props }) => (
      <h3 className={`text-xl ${baseHeading} mt-6 mb-3`} {...props}>
        {children}
      </h3>
    ),
    h4: ({ children, ...props }) => (
      <h4 className={`text-lg ${baseHeading} mt-5 mb-2`} {...props}>
        {children}
      </h4>
    ),
    // Paragraph
    p: ({ children, ...props }) => (
      <p className="mb-4 leading-relaxed" {...props}>
        {children}
      </p>
    ),
    // Lists
    ul: ({ children, ...props }) => (
      <ul className="list-disc pl-6 mb-4" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }) => (
      <ol className="list-decimal pl-6 mb-4" {...props}>
        {children}
      </ol>
    ),
    li: ({ children, ...props }) => (
      <li className="mb-1" {...props}>
        {children}
      </li>
    ),
    a: ({ children, href, ...props }) => (
      <Link
        href={href ?? '#'}
        className="underline text-primary hover:text-primary-foreground"
        {...props}
      >
        {children}
      </Link>
    ),
    strong: ({ children, ...props }) => (
      <strong className="font-semibold" {...props}>
        {children}
      </strong>
    ),
    ...components,
  };
}
