import { LogProvider } from "../log.module";

const reg = /https:\/\/paste.gg\/p\/[\w]*\/[\w]*/;

export const pasteGG: LogProvider = {
  hostnames: ["paste.gg"],
  async parse(text) {
    const r = text.match(reg);
    if (r == null || !r[0]) return null;
    const link = r[0];
    const id = link.replace(/https:\/\/paste.gg\/p\/[\w]*\//, "");
    if (!id) return null;
    try {
      const pasteJson = await (
        await fetch("https://api.paste.gg/v1/pastes/" + id)
      ).json();
      if (pasteJson.status != "success") throw "up";
      const pasteData = await (
        await fetch(
          "https://api.paste.gg/v1/pastes/" +
            id +
            "/files/" +
            pasteJson.result.files[0].id,
        )
      ).json();
      if (pasteData.status != "success") throw "up";
      return pasteData.result.content.value;
    } catch (err) {
      console.log("Log analyze fail", err);
      return null;
    }
  },
};
