import YAML from "yaml";
import fs from "fs";
import z from "zod";
import { Log } from "./log";
import semver from "semver";

const zIssues = z.record(
  z.union([
    z.object({
      mods: z.record(z.string()),
      message: z.string(),
    }),
    z.object({
      regex: z.string(),
      message: z.string(),
    }),
  ]),
);

console.log("loading log issues...");
const file = fs.readFileSync(__dirname + "/logChecks.yaml", "utf-8");
export const issues = zIssues.parse(YAML.parse(file));

export const checkLogForIssues = (log: Log) => {
  // this is a sin against humanity, however it seems to work
  type recordOrValue =
    | string
    | number
    | {
        [key: string]: number | string | recordOrValue;
      };
  const logData: recordOrValue = {
    ...log,
    mods: Object.fromEntries(log.mods!),
  };

  const foundIssues: {
    name: string;
    value: string;
  }[] = [];
  for (const issueName in issues) {
    const issue = issues[issueName];
    if ("mods" in issue) {
      for (const mod in issue.mods) {
        if (!log.mods?.has(mod)) continue;
        const parsedVersion = semver.coerce(log.mods.get(mod));
        if (!parsedVersion) continue;
        if (semver.satisfies(parsedVersion, issue.mods[mod]))
          foundIssues.push({
            name: issueName,
            value: issue.message.replace(/{[^}]+\}/g, (match) => {
              let ret: recordOrValue = logData;
              for (const key of match.slice(1, -1).split(".")) {
                if (ret && typeof ret == "object" && key in ret) ret = ret[key];
                else return "not found";
              }
              return `${ret}`;
            }),
          });
      }
    }
  }
  return foundIssues;
};
