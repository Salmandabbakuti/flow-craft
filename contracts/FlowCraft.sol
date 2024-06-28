// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import {ISuperfluid, ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";
import {SuperTokenV1Library} from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperTokenV1Library.sol";
import {SuperAppBaseFlow} from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperAppBaseFlow.sol";

/// @title BalanceCraft - Dynamic NFT that updates based on Superfluid stream events
/// @author Salman Dev
/// @notice This contract allows users to mint unique NFTs that evolve based on the amount of tokens streamed to the contract.
/// @dev The contract uses SuperAppBaseFlow to handle Superfluid stream events and update NFT attributes accordingly.
contract FlowCraft is ERC721, SuperAppBaseFlow {
    using Strings for uint256;
    using Strings for uint8;
    using SuperTokenV1Library for ISuperToken;

    ISuperToken internal immutable supportedToken;
    uint256 public currentTokenId = 1;

    struct FlowInfo {
        int96 currentFlowRate;
        uint256 totalStreamed;
        uint256 createdAt;
        uint256 lastUpdated;
        uint256 tokenId;
    }

    mapping(address => FlowInfo) public flowInfoByAddress;

    constructor(
        ISuperfluid host,
        ISuperToken _supportedToken
    ) ERC721("FlowCraft", "FCR") SuperAppBaseFlow(host, true, true, true, "") {
        supportedToken = _supportedToken;
    }

    function createFlowToContract(int96 _flowRate) external {
        bool success = supportedToken.createFlow(address(this), _flowRate);
        require(success, "Create flow to contract failed");
    }

    function deleteFlowToContract() external {
        bool success = supportedToken.deleteFlow(msg.sender, address(this));
        require(success, "Delete flow to contract failed");
    }

    function updateFlowToContract(int96 _newFlowRate) external {
        bool success = supportedToken.updateFlow(address(this), _newFlowRate);
        require(success, "Update flow to contract failed");
    }

    /// @notice Get the URI for a token
    /// @param tokenId The ID of the token
    /// @dev This function will return the token URI in JSON based on the flow opened by the token owner. Overrides ERC721 tokenURI function
    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        return _getTokenURI(tokenId);
    }

    /// @notice Prepare and return the URI for a token (internal)
    /// @param _tokenId The ID of the token
    /// @dev This function will return the token URI in JSON based on the flow opened by the token owner
    function _getTokenURI(
        uint256 _tokenId
    ) internal view returns (string memory) {
        address tokenOwner = ownerOf(_tokenId);
        FlowInfo memory flow = flowInfoByAddress[tokenOwner];

        // calculate totalamount streamed since create
        uint256 realTimeTotalStreamed = flow.totalStreamed;
        if (flow.currentFlowRate > 0) {
            uint256 timeElapsed = block.timestamp - flow.lastUpdated;
            realTimeTotalStreamed +=
                uint256(int256(flow.currentFlowRate)) *
                timeElapsed;
        }

        // Define the metadata attributes
        string memory name = string(
            abi.encodePacked("FlowCrafter #", _tokenId.toString())
        );
        string
            memory description = "Unleash your financial powers with FlowCraft collection. These in-game items showcase your ever-evolving powers, level, all while you stream tokens to the contract.";

        // Get the level of the user
        uint8 level = _getLevel(flow.totalStreamed);
        string memory levelString = _levelToString(level);
        string memory imageURI = _getImageUriForLevel(level);
        uint256 age = block.timestamp - flow.createdAt;

        // Create the JSON metadata object
        bytes memory json = abi.encodePacked(
            "{",
            '"name": "',
            name,
            '",',
            '"description": "',
            description,
            '",',
            '"image": "',
            imageURI,
            '",',
            '"attributes": [',
            '{"trait_type": "Power", "value": ',
            realTimeTotalStreamed.toString(),
            "},",
            '{"trait_type": "Speed", "value": ',
            uint256(int256(flow.currentFlowRate)).toString(),
            "},",
            '{"trait_type": "Age", "value": ',
            age.toString(),
            "},",
            '{"trait_type": "Level", "value": ',
            level.toString(),
            "},",
            '{"trait_type": "Rank", "value": "',
            levelString,
            '"}',
            "]",
            "}"
        );

        return
            string(
                abi.encodePacked(
                    "data:application/json;base64,",
                    Base64.encode(json)
                )
            );
    }

    /// @notice Internal function to determine the level based on the total streamed amount
    /// @param amount The total amount streamed by the user
    /// @dev amount can be compared with ether since all supertokens are  18 decimals and pegged to ether(in wei)
    /// @return The level of the user
    function _getLevel(uint256 amount) internal pure returns (uint8) {
        if (amount >= 0 && amount < 0.1 ether) {
            return 0;
        } else if (amount >= 0.1 ether && amount < 0.2 ether) {
            return 1;
        } else if (amount >= 0.2 ether && amount < 0.3 ether) {
            return 2;
        } else if (amount >= 0.3 ether && amount < 0.4 ether) {
            return 3;
        } else if (amount >= 0.4 ether && amount < 0.6 ether) {
            return 4;
        } else if (amount >= 0.6 ether && amount < 0.9 ether) {
            return 5;
        } else {
            return 6;
        }
    }

    function _levelToString(
        uint8 _level
    ) internal pure returns (string memory) {
        if (_level == 0) {
            return "Bronze";
        } else if (_level == 1) {
            return "Silver";
        } else if (_level == 2) {
            return "Gold";
        } else if (_level == 3) {
            return "Platinum";
        } else if (_level == 4) {
            return "Diamond";
        } else if (_level == 5) {
            return "Master";
        } else {
            return "GrandMaster";
        }
    }

    function _getImageUriForLevel(
        uint8 _level
    ) internal pure returns (string memory) {
        // Define and return the image URI based on the level
        // For simplicity, this function returns an empty string
        return "";
    }

    function isAcceptedSuperToken(
        ISuperToken superToken
    ) public view virtual override returns (bool) {
        return superToken == supportedToken;
    }

    function onFlowCreated(
        ISuperToken superToken,
        address sender,
        bytes calldata ctx
    ) internal virtual override returns (bytes memory /*newCtx*/) {
        require(superToken == supportedToken, "Unsupported token");

        FlowInfo storage flow = flowInfoByAddress[sender];

        // Mint new NFT if the sender does not have one
        if (flow.tokenId == 0) {
            _safeMint(sender, currentTokenId);
            flow.tokenId = currentTokenId;
            currentTokenId++;
        }

        (, int96 flowRate, , ) = superToken.getFlowInfo(sender, address(this));
        flow.currentFlowRate = flowRate;
        flow.createdAt = block.timestamp;
        flow.lastUpdated = block.timestamp;

        return ctx;
    }

    function onFlowUpdated(
        ISuperToken superToken,
        address sender,
        int96 previousFlowRate,
        uint256 lastUpdated,
        bytes calldata ctx
    ) internal virtual override returns (bytes memory /*newCtx*/) {
        require(superToken == supportedToken, "Unsupported token");

        FlowInfo storage flow = flowInfoByAddress[sender];

        (, int96 flowRate, , ) = superToken.getFlowInfo(sender, address(this));
        flow.currentFlowRate = flowRate;
        flow.totalStreamed +=
            uint256(int256(flowRate) - int256(previousFlowRate)) *
            (block.timestamp - lastUpdated);
        flow.lastUpdated = block.timestamp;

        return ctx;
    }

    function onFlowDeleted(
        ISuperToken superToken,
        address sender,
        address,
        int96 previousFlowRate,
        uint256 lastUpdated,
        bytes calldata ctx
    ) internal virtual override returns (bytes memory /*newCtx*/) {
        require(superToken == supportedToken, "Unsupported token");

        FlowInfo storage flow = flowInfoByAddress[sender];
        flow.totalStreamed +=
            uint256(int256(previousFlowRate)) *
            (block.timestamp - lastUpdated);
        flow.currentFlowRate = 0;
        flow.lastUpdated = block.timestamp;

        return ctx;
    }
}
