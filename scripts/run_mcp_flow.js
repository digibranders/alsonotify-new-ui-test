const { spawn } = require('child_process');
const path = require('path');

const API_KEY = process.env.TESTSPRITE_API_KEY;
if (!API_KEY) {
    console.error("TESTSPRITE_API_KEY not set");
    process.exit(1);
}

const serverPath = path.resolve('node_modules/@testsprite/testsprite-mcp/dist/index.js');
const projectPath = "/Users/apple/Desktop/Alsonotify/alsonotify-new-ui";
const projectName = "alsonotify-new-ui";

console.log(`Starting server from: ${serverPath}`);

const server = spawn('node', [serverPath], {
    env: {
        ...process.env,
        API_KEY: API_KEY
    },
    stdio: ['pipe', 'pipe', 'inherit']
});

let idCounter = 0;
function send(method, params) {
    const id = idCounter++;
    const msg = {
        jsonrpc: "2.0",
        method,
        params,
        id
    };
    const str = JSON.stringify(msg);
    // console.log("Sending:", str); // Debug
    server.stdin.write(str + "\n");
    return id;
}

let pendingRequests = {};

server.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
        if (!line.trim()) continue;
        try {
            const msg = JSON.parse(line);
            // console.log("Received:", JSON.stringify(msg).substring(0, 200)); // Debug
            if (msg.id !== undefined && pendingRequests[msg.id]) {
                pendingRequests[msg.id](msg);
                delete pendingRequests[msg.id];
            }
        } catch (e) {
            // ignore
        }
    }
});

function request(method, params) {
    return new Promise((resolve, reject) => {
        const id = send(method, params);
        pendingRequests[id] = resolve;
    });
}

async function run() {
    console.log("Initializing...");
    await request("initialize", {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "manual-client", version: "1.0" }
    });
    send("notifications/initialized", {});
    console.log("Initialized.");

    console.log("Generating Code Summary...");
    let res = await request("tools/call", {
        name: "testsprite_generate_code_summary",
        arguments: {
            projectRootPath: projectPath
        }
    });
    if (res.error) {
        console.error("Code Summary Error:", res.error);
        process.exit(1);
    }
    console.log("Code Summary Result:", JSON.stringify(res.result.content));

    console.log("Generating Frontend Test Plan...");
    res = await request("tools/call", {
        name: "testsprite_generate_frontend_test_plan",
        arguments: {
            projectPath: projectPath,
            needLogin: true
        }
    });
    if (res.error) {
        console.error("Test Plan Error:", res.error);
        process.exit(1);
    }
    console.log("Test Plan Result:", JSON.stringify(res.result.content));

    console.log("Generating Code and Executing...");
    res = await request("tools/call", {
        name: "testsprite_generate_code_and_execute",
        arguments: {
            projectName: projectName,
            projectPath: projectPath,
            testIds: [],
            additionalInstruction: "Run comprehensive integration tests for login, dashboard loading, and key user flows. Use these credentials for login tests: Email: 'siddique@digibrantders.com', Password: 'Admin@12345'. Verify successful login."
        }
    });
    if (res.error) {
        console.error("Execution Error:", res.error);
        process.exit(1);
    }
    console.log("Execution Result:", JSON.stringify(res.result.content));

    server.kill();
}

run().catch(e => {
    console.error(e);
    server.kill();
});
