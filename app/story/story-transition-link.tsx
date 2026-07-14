"use client";

import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";

type StoryTransitionLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    children: ReactNode;
  };

export function StoryTransitionLink({ children, ...props }: StoryTransitionLinkProps) {
  return (
    <Link {...props} data-story-transition="true">
      {children}
    </Link>
  );
}
