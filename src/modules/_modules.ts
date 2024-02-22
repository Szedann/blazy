import { Module } from "../handlers/module.handler";
import { logModule } from "./logs/log.module";
import { testModule } from "./test/test.module";

export const modules: Module[] = [testModule, logModule] as const;
