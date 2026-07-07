// Module-level holder for the model selected in the chat header, so
// askTerritorio can send it on every /datos call without prop drilling.
// The backend re-validates against its whitelist and falls back to the
// user's persisted preference (or the server default) when absent.
let selectedModel = null

export function getSelectedModel() {
  return selectedModel
}

export function setSelectedModel(model) {
  selectedModel = model || null
}
