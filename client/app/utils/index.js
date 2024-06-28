import { Contract } from "@ethersproject/contracts";
import { formatEther, parseEther } from "@ethersproject/units";
import { FLOWCRAFT_ADDRESS } from "./constants";

const FLOWCRAFT_ABI = [
  "function createFlowToContract(int96 _flowRate)",
  "function deleteFlowToContract()",
  "function updateFlowToContract(int96 _flowRate)",
  "function getFlowInfoByAddress(address) view returns (int96 currentFlowRate, uint256 totalStreamed, uint256 createdAt, uint256 lastUpdated, uint256 tokenId)",
  "function tokenURI(uint256) view returns (string)",
];

export const flowCraftContract = new Contract(FLOWCRAFT_ADDRESS, FLOWCRAFT_ABI);

export const calculateFlowRateInTokenPerMonth = (amount) => {
  if (isNaN(amount)) return 0;
  // convert from wei/sec to token/month for displaying in UI
  // 2628000 = 1 month in seconds(sf recommendation)
  const flowRate = Math.round(formatEther(amount) * 2628000).toFixed(2);
  return flowRate;
};

export const calculateFlowRateInWeiPerSecond = (amount) => {
  // convert amount from token/month to wei/second for sending to superfluid
  const flowRateInWeiPerSecond = parseEther(amount.toString())
    .div(2628000)
    .toString();
  return flowRateInWeiPerSecond;
};
