import type { MDXComponents } from "mdx/types";

const components: MDXComponents = {
  h2: (props) => (
    <h2
      className="mt-10 mb-3 font-heading text-2xl font-bold first:mt-0"
      {...props}
    />
  ),
  h3: (props) => <h3 className="mt-6 mb-2 text-lg font-semibold" {...props} />,
  p: (props) => <p className="my-4 text-lg leading-relaxed" {...props} />,
  ol: (props) => (
    <ol
      className="my-4 list-decimal space-y-3 pl-6 text-lg leading-relaxed marker:font-semibold marker:text-primary"
      {...props}
    />
  ),
  ul: (props) => (
    <ul
      className="my-4 list-disc space-y-2 pl-6 text-lg leading-relaxed marker:text-primary"
      {...props}
    />
  ),
  a: (props) => (
    <a
      className="font-medium text-primary underline underline-offset-4"
      {...props}
    />
  ),
  strong: (props) => <strong className="font-semibold" {...props} />,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
