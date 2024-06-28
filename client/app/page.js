"use client";
import { useState, useEffect } from "react";
import { useSigner, useAddress } from "@thirdweb-dev/react";
import { formatUnits, formatEther } from "@ethersproject/units";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  Button,
  Input,
  message,
  Space,
  Card,
  Popconfirm,
  Statistic,
  Empty,
  Row,
  Col,
  Typography,
  Divider,
  Image
} from "antd";
import {
  SyncOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusCircleOutlined
} from "@ant-design/icons";
import {
  flowCraftContract as contract,
  calculateFlowRateInTokenPerMonth,
  calculateFlowRateInWeiPerSecond
} from "./utils";

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

export default function Home() {
  const [dataLoading, setDataLoading] = useState(false);
  const [loading, setLoading] = useState({ connect: false });
  const [flowInfo, setFlowInfo] = useState(null);
  const [tokenMetadata, setTokenMetadata] = useState(null);
  const [flowRateInput, setFlowRateInput] = useState(0);

  const account = useAddress();
  const signer = useSigner();

  const handleDeleteFlowToContract = async () => {
    if (!account || !signer)
      return message.error("Please connect wallet first");
    if (!flowInfo) return message.error("No flow found open to contract");
    try {
      const tx = await contract.connect(signer).deleteFlowToContract();
      await tx.wait();
      message.success("Flow deleted successfully");
    } catch (err) {
      message.error("Failed to delete Flow");
      console.error("failed to delete Flow: ", err);
    }
  };

  const handleCreateFlowToContract = async () => {
    if (!account || !signer)
      return message.error("Please connect wallet first");
    if (!flowRateInput) return message.error("Please enter flow rate");
    try {
      setLoading({ mintItem: true });
      const flowRateInWeiPerSecond =
        calculateFlowRateInWeiPerSecond(flowRateInput);
      console.log("flowRateInWeiPerSecond: ", flowRateInWeiPerSecond);
      const tx = await contract
        .connect(signer)
        .createFlowToContract(flowRateInWeiPerSecond);
      await tx.wait();
      message.success("Flow opened to contract successfully");
      setLoading({ mintItem: false });
    } catch (err) {
      setLoading({ mintItem: false });
      message.error("Failed to open flow to contract");
      console.error("failed to open flow to contract: ", err);
    }
  };

  const getFlowInfoToContract = async () => {
    if (!account || !signer)
      return message.error("Please connect wallet first");
    setDataLoading(true);
    try {
      const flowInfo = await contract
        .connect(signer?.provider)
        .flowInfoByAddress(account);
      console.log("flowInfo: ", flowInfo);
      const parsedFlowInfo =
        flowInfo?.createdAt?.toString() === "0"
          ? null
          : {
            currentFlowRate: flowInfo?.currentFlowRate?.toString(),
            totalStreamed: flowInfo?.totalStreamed?.toString(),
            createdAt: flowInfo?.createdAt?.toString(),
            lastUpdated: flowInfo?.lastUpdated?.toString(),
            tokenId: flowInfo?.tokenId?.toString()
          };
      if (parsedFlowInfo?.tokenId) {
        // get token metadata
        const uri = await contract
          .connect(signer?.provider)
          .tokenURI(parsedFlowInfo?.tokenId);
        const base64Uri = uri.split(",")[1];
        const metadata = JSON.parse(atob(base64Uri));
        setTokenMetadata(metadata);
      }
      setFlowInfo(parsedFlowInfo);
      setDataLoading(false);
    } catch (err) {
      message.error("Failed to get flow info to contract");
      setDataLoading(false);
      console.error("failed to get flow info to contract: ", err);
    }
  };

  useEffect(() => {
    if (account) {
      getFlowInfoToContract();
    }
  }, [account]);

  const renderMetadata = () => {
    if (!tokenMetadata) return null;
    return (
      <Card>
        <Title level={4}>NFT Metadata</Title>
        <Row>
          <Col span={8}>
            <Image
              src={tokenMetadata?.image}
              alt="NFT"
              style={{ width: 200, height: 200 }}
            />
          </Col>
          <Col span={16}>
            <p>
              <strong>Name:</strong> {tokenMetadata?.name}
            </p>
            <p>
              <strong>Description:</strong> {tokenMetadata?.description}
            </p>
            <p>
              <strong>Attributes:</strong>
            </p>
            {tokenMetadata?.attributes?.map((attr) => (
              <Statistic
                key={attr?.trait_type}
                title={attr?.trait_type}
                value={attr?.value}
              />
            ))}
          </Col>
        </Row>
      </Card>
    );
  };

  return (
    <div className="App">
      <Row justify="center" style={{ marginTop: 50 }}>
        <Col span={12}>
          <Card
            title="Your Flow to Contract"
            extra={
              <Space>
                <Button
                  type="primary"
                  shape="circle"
                  icon={<SyncOutlined spin={dataLoading} />}
                  onClick={getFlowInfoToContract}
                />
                {
                  // if flowInfo is not null, show the buttons(edit,delete)
                  // else show the button to open a new stream
                  flowInfo ? (
                    <>
                      <Popconfirm
                        title="Enter FlowRate"
                        description={
                          <Input
                            placeholder="Enter new FlowRate"
                            type="number"
                            onChange={(e) => setFlowRateInput(e.target.value)}
                            addonAfter="fDAIx/mo"
                          />
                        }
                        onConfirm={handleCreateFlowToContract}
                      >
                        <Button
                          type="primary"
                          shape="circle"
                          icon={<EditOutlined />}
                        />
                      </Popconfirm>
                      <Popconfirm
                        title="Are you sure to delete Flow to contract?"
                        onConfirm={handleDeleteFlowToContract}
                      >
                        <Button
                          type="primary"
                          danger
                          shape="circle"
                          icon={<DeleteOutlined />}
                        />
                      </Popconfirm>
                    </>
                  ) : (
                    <Popconfirm
                      title="Enter FlowRate"
                      description={
                        <Input
                          placeholder="Enter FlowRate"
                          type="number"
                          onChange={(e) => setFlowRateInput(e.target.value)}
                          addonAfter="fDAIx/mo"
                        />
                      }
                      onConfirm={handleCreateFlowToContract}
                    >
                      <Button shape="circle" icon={<PlusCircleOutlined />} />
                    </Popconfirm>
                  )
                }
              </Space>
            }
          >
            {flowInfo ? (
              <>
                <Statistic
                  style={{ textAlign: "center", marginBottom: 20 }}
                  title="Total Amount Streamed"
                  value={formatEther(flowInfo?.totalStreamed)}
                  suffix="fDAIx"
                  precision={6}
                />
                <Row>
                  <Col span={8}>
                    <Statistic
                      title="Sender (You)"
                      value={
                        account?.slice(0, 6) + "..." + account?.slice(-4)
                      }
                    />
                  </Col>
                  <Col span={8} style={{ textAlign: "center" }}>
                    <Image
                      src="/flow_animation.gif"
                      alt="flow-animation"
                      width={100}
                      height={70}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="Receiver (Contract)"
                      value={
                        contract?.address?.slice(0, 6) +
                        "..." +
                        contract?.address?.slice(-4)
                      }
                    />
                  </Col>
                </Row>
                <Statistic
                  style={{ textAlign: "center", marginTop: 20 }}
                  title="Flow Rate"
                  value={calculateFlowRateInTokenPerMonth(
                    flowInfo?.currentFlowRate
                  )}
                  suffix="fDAIx/mo"
                  precision={6}
                />
                <Divider />
                {renderMetadata()}
              </>
            ) : (

              <Empty
                description="No flow found. Open a flow to contract and
                              unlock your super powers"
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
