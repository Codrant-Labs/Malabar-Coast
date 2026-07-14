import type { ReactNode } from "react";
import { StoryExperience } from "./story-experience";
import "./story-awwards.css";

export default function StoryLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <StoryExperience>{children}</StoryExperience>;
}
