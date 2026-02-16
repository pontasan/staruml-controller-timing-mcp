import { createServer, timingTools } from "staruml-controller-mcp-core"

export function createTimingServer() {
    return createServer("staruml-controller-timing", "1.0.0", timingTools)
}
