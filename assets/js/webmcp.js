// WebMCP tools for the WAVE agent site — guarded, best-effort.
//
// This site is a read-only content site: it has no API, no forms, no
// sign-in, no MCP server, and no interactive tools. These two tools are
// the only ones registered, and only if the browser exposes the draft
// WebMCP API (document.modelContext). If the API is absent, this script
// does nothing. No toolname attributes are used anywhere on the site
// because there are no forms to attach them to.
//
// Tools:
//   contact_wave — opens the real mailto: link to the Foundation steward.
//   get_agent_guide — fetches /llms.txt and returns its text.
(function () {
  if (
    typeof document === "undefined" ||
    !("modelContext" in document) ||
    !document.modelContext ||
    typeof document.modelContext.registerTool !== "function"
  ) {
    return;
  }

  document.modelContext.registerTool({
    name: "contact_wave",
    description:
      "Open an email to the AGI Future Foundation steward (x@agifuturefoundation.org) about WAVE. Use for agent registration and inquiries; subject lines start with [Agent] and must name the operator and the human principal.",
    execute: function () {
      window.location.href =
        "mailto:x@agifuturefoundation.org?subject=%5BAgent%5D%20WAVE%20";
      return "Opening an email to x@agifuturefoundation.org about WAVE.";
    },
  });

  document.modelContext.registerTool({
    name: "get_agent_guide",
    description:
      "Fetch this site's agent guide (/llms.txt) and return its text. It describes WAVE — WAVE : Wild Animal Voice Engine — its verified facts as of 2026-11-06, and what agents may and may not do.",
    execute: async function () {
      var response = await fetch("/llms.txt");
      if (!response.ok) {
        throw new Error("Could not fetch /llms.txt: " + response.status);
      }
      return await response.text();
    },
  });
})();
