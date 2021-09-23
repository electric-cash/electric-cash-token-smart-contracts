pragma solidity ^0.8.6;

import "./Welcash.sol";

contract TwoKeyController {

    struct PendingMintProposal{
        address recipient;
        uint256 amount;
    }

    struct PendingTokenOwnershipChangeProposal{
        address newOwner;
    }

    event mintProposed(address proposer, address recipient, uint256 amount);
    event mintProposalRevoked(address proposer, address recipient, uint256 amount);

    event ownershipChangeProposed(address proposer, address newOwner);
    event ownershipChangeProposalRevoked(address proposer, address newOwner);

    Welcash tokenContract;
    mapping(address => bool) private _signers;
    mapping(address => PendingMintProposal) public mintProposals;
    mapping(address => PendingTokenOwnershipChangeProposal) public ownershipChangeProposals;

    modifier onlySigner() {
        require(_signers[msg.sender], "Feature is only available for approved signers");
        _;
    }

    constructor(Welcash token, address[] memory signers){
        require(signers.length == 2, "There should be exactly two signers");
        tokenContract = token;
        for(uint8 i = 0; i < 2; i++)
            _signers[signers[i]] = true;
    }

    function proposeMint(address recipient, uint256 amount) external onlySigner{
        mintProposals[msg.sender] = PendingMintProposal(recipient, amount);
        emit mintProposed(msg.sender, recipient, amount);
    }

    function revokeMintProposal() external onlySigner{
        require(mintProposals[msg.sender].recipient != address(0), "No proposal to revoke");
        require(mintProposals[msg.sender].amount != 0, "No proposal to revoke");
        delete mintProposals[msg.sender];
    }

    function confirmMintProposal(address proposer, address expectedRecipient, uint256 expectedAmount) external onlySigner{
        require(msg.sender != proposer, "cannot confirm own proposal");
        if(mintProposals[proposer].recipient == expectedRecipient && mintProposals[proposer].amount == expectedAmount){
            tokenContract.mint(expectedRecipient, expectedAmount);
            delete mintProposals[proposer];
        }
    }

    function proposeOwnershipChange(address newOwner) external onlySigner{
        ownershipChangeProposals[msg.sender] = PendingTokenOwnershipChangeProposal(newOwner);
        emit ownershipChangeProposed(msg.sender, newOwner);
    }

    function revokeOwnershipChangeProposal() external onlySigner{
        require(ownershipChangeProposals[msg.sender].newOwner != address(0), "No proposal to revoke");
        delete ownershipChangeProposals[msg.sender];
    }

    function confirmOwnershipChangeProposal(address proposer, address expectedNewOwner) external onlySigner{
        require(msg.sender != proposer, "cannot confirm own proposal");
        if(ownershipChangeProposals[proposer].newOwner == expectedNewOwner){
            tokenContract.transferOwnership(expectedNewOwner);
            delete ownershipChangeProposals[proposer];
        }
    }
}
