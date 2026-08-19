#!/usr/bin/env node

import * as cdk from "aws-cdk-lib";
import { TraceCellStack } from "../lib/tracecell-stack.js";

const app = new cdk.App();

new TraceCellStack(app, "TraceCellStack");
