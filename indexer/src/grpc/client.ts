import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";

const PROTO_PATH = path.join(__dirname, "yellowstone.proto");

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
});

const protoDescriptor: any = grpc.loadPackageDefinition(packageDefinition);
export const GeyserGrpcService = protoDescriptor.geyser.GeyserGrpcService;
