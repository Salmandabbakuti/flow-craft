import { Contract } from "@ethersproject/contracts";
import { FLOWCRAFT_ADDRESS } from "./constants";

const FLOWCRAFT_ABI = [
  "function createFlowToContract(int96 _flowRate)",
  "function deleteFlowToContract()",
  "function updateFlowToContract(int96 _flowRate)",
  "function flowInfoByAddress(address) view returns (int96 currentFlowRate, uint256 totalStreamed, uint256 createdAt, uint256 lastUpdated, uint256 tokenId)",
  "function tokenURI(uint256) view returns (string)",
];

export const flowCraftContract = new Contract(FLOWCRAFT_ADDRESS, FLOWCRAFT_ABI);
