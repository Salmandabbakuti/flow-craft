"use client";
import { useState, useEffect } from "react";
import { useSigner, useAddress } from "@thirdweb-dev/react";
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
  Tabs,
  Row,
  Col,
  Divider,
  Descriptions,
  Image
} from "antd";
import {
  SyncOutlined,
  EditOutlined,
  DeleteOutlined,
  ArrowRightOutlined,
  ExportOutlined,
  PlusCircleOutlined
} from "@ant-design/icons";
import { flowCraftContract as contract } from "./utils";

dayjs.extend(relativeTime);

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
    if (!stream) return message.error("No flow found open to contract");
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
      const tx = await contract.connect(signer).createFlowToContract(flowRateInput);
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
      const parsedFlowInfo = flowInfo?.createdAt?.toString() === "0" ? null : {
        currentFlowRate: flowInfo?.currentFlowRate?.toString(),
        totalStreamed: flowInfo?.totalStreamed?.toString(),
        createdAt: flowInfo?.createdAt?.toString(),
        lastUpdated: flowInfo?.lastUpdated?.toString(),
        tokenId: flowInfo?.tokenId?.toString()
      };
      if (parsedFlowInfo?.tokenId) {
        // get token metadata
        const uri = await contract.connect(signer?.provider).tokenURI(parsedFlowInfo?.tokenId);
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
      <Descriptions title="NFT Metadata" bordered>
        <Descriptions.Item label="Name">{tokenMetadata.name}</Descriptions.Item>
        <Descriptions.Item label="Description">{tokenMetadata.description}</Descriptions.Item>
        <Descriptions.Item label="Image">
          <Image src={tokenMetadata.image} alt="NFT" style={{ width: 200, height: 200 }} />
        </Descriptions.Item>
        {tokenMetadata.attributes.map(attr => (
          <Descriptions.Item key={attr.trait_type} label={attr.trait_type}>
            {attr.value}
          </Descriptions.Item>
        ))}
      </Descriptions>
    );
  };

  return (
    <div className="App">
      <Row justify="center" style={{ marginTop: 50 }}>
        <Col span={12}>
          <Card
            title="FlowCraft"
            extra={
              <Space>
                <Button
                  type="primary"
                  shape="circle"
                  icon={<SyncOutlined spin={dataLoading} />}
                  onClick={getFlowInfoToContract}
                // loading={dataLoading}
                />
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
                  <Button
                    shape="circle"
                    icon={<PlusCircleOutlined />}
                  // onClick={handleMintItem}
                  // loading={}
                  />
                </Popconfirm>
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
              </Space>
            }
          >
            {flowInfo ? (
              <Space direction="vertical">
                <Statistic
                  title="Current Flow Rate"
                  value={flowInfo.currentFlowRate}
                  suffix="fDAIx/mo"
                />
                <Statistic
                  title="Total Streamed"
                  value={flowInfo.totalStreamed}
                  suffix="fDAIx"
                />
                <Statistic
                  title="Created At"
                  value={dayjs.unix(flowInfo.createdAt).fromNow()}
                />
                <Statistic
                  title="Last Updated"
                  value={dayjs.unix(flowInfo.lastUpdated).fromNow()}
                />
                <Divider />
                <Descriptions title="FlowCraft Contract" bordered>
                  <Descriptions.Item label="Address">{contract.address}</Descriptions.Item>
                  <Descriptions.Item label="Token ID">{flowInfo.tokenId}</Descriptions.Item>
                </Descriptions>
                {renderMetadata()}
              </Space>
            ) : (
              <Empty description="No Flow to contract" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
