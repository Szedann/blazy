import { Module } from "..";
import { testModule } from "./test/test.module";

export const modules: Module[] = [testModule] as const;
