import { Module } from "../handlers/module.handler";
import { testModule } from "./test/test.module";

export const modules: Module[] = [testModule] as const;
