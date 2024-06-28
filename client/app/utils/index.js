import { Contract } from "@ethersproject/contracts";
import { GDAV1_FORWARDER_ADDRESS } from "./constants";

const GDAV1_FORWARDER_ABI = [
  "constructor(address host)",
  "function claimAll(address pool, address memberAddress, bytes userData) returns (bool success)",
  "function connectPool(address pool, bytes userData) returns (bool)",
  "function createPool(address token, address admin, tuple(bool transferabilityForUnitsOwner, bool distributionFromAnyAddress) config) returns (bool success, address pool)",
  "function disconnectPool(address pool, bytes userData) returns (bool)",
  "function distribute(address token, address from, address pool, uint256 requestedAmount, bytes userData) returns (bool)",
  "function distributeFlow(address token, address from, address pool, int96 requestedFlowRate, bytes userData) returns (bool)",
  "function estimateDistributionActualAmount(address token, address from, address to, uint256 requestedAmount) view returns (uint256 actualAmount)",
  "function estimateFlowDistributionActualFlowRate(address token, address from, address to, int96 requestedFlowRate) view returns (int96 actualFlowRate, int96 totalDistributionFlowRate)",
  "function getFlowDistributionFlowRate(address token, address from, address to) view returns (int96)",
  "function getNetFlow(address token, address account) view returns (int96)",
  "function getPoolAdjustmentFlowInfo(address pool) view returns (address, bytes32, int96)",
  "function getPoolAdjustmentFlowRate(address pool) view returns (int96)",
  "function isMemberConnected(address pool, address member) view returns (bool)",
  "function isPool(address token, address account) view returns (bool)",
  "function updateMemberUnits(address pool, address memberAddress, uint128 newUnits, bytes userData) returns (bool success)"
];

export const gdav1ForwarderContract = new Contract(GDAV1_FORWARDER_ADDRESS, GDAV1_FORWARDER_ABI);
