// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/ISemaphore.sol";

contract YOURegistry is Ownable {
    ISemaphore public semaphore;

    struct Reputation {
        address admin;
        string name;
        string contentURI;
        uint256 lowerGroupId;
        uint256 upperGroupId;
    }

    event ReputationAdded(uint256 indexed reputationId, string name);
    event ReputationRemoved(uint256 indexed reputationId, string name);

    error ReputationDoesNotExists();
    error ReputationIdAlreadyExists();
    error NotReputationAdmin();
    error OutOfGroupIdRange(uint256 lowerGroupId, uint256 upperGroupId);

    mapping(uint256 => Reputation) private _reputations;

    modifier onlyReputationAdmin(uint256 reputationId) {
        if (_reputations[reputationId].admin != _msgSender()) {
            revert NotReputationAdmin();
        }
        _;
    }

    constructor() {}

    function updateSemaphore(ISemaphore _semaphore) external onlyOwner {
        semaphore = _semaphore;
    }

    function updateSemaphoreRegistry(address _address) external onlyOwner {
        semaphore.updateRegistry(_address);
    }

    function _reputationExists(
        uint256 reputationId
    ) internal view returns (bool) {
        return _reputations[reputationId].admin != address(0);
    }

    function addReputation(
        uint256 reputationId,
        address admin,
        string memory name,
        string memory contentURI,
        uint256 lowerGroupId,
        uint256 upperGroupId
    ) external onlyOwner returns (uint256) {
        if (_reputationExists(reputationId)) {
            revert ReputationIdAlreadyExists();
        }
        _reputations[reputationId] = Reputation(
            admin,
            name,
            contentURI,
            lowerGroupId,
            upperGroupId
        );
        emit ReputationAdded(reputationId, name);
        return reputationId;
    }

    function removeReputation(uint256 reputationId) external onlyOwner {
        if (!_reputationExists(reputationId)) {
            revert ReputationDoesNotExists();
        }
        string memory name = _reputations[reputationId].name;
        delete _reputations[reputationId];
        emit ReputationRemoved(reputationId, name);
    }

    function updateReputationURI(
        uint256 reputationId,
        string memory contentURI
    ) external onlyReputationAdmin(reputationId) {
        _reputations[reputationId].contentURI = contentURI;
    }

    function updateReputationAdmin(
        uint256 reputationId,
        address admin
    ) external onlyReputationAdmin(reputationId) {
        _reputations[reputationId].admin = admin;
    }

    function reputationInfo(
        uint256 reputationId
    ) public view returns (string memory name, string memory contentURI, address admin) {
        if (!_reputationExists(reputationId)) {
            revert ReputationDoesNotExists();
        }
        Reputation memory reputation = _reputations[reputationId];
        name = reputation.name;
        contentURI = reputation.contentURI;
        admin = reputation.admin;
    }

    function createGroup(
        uint256 reputationId,
        uint256 groupId,
        uint256 depth
    ) external onlyReputationAdmin(reputationId) {
        Reputation memory reputation = _reputations[reputationId];
        if (
            groupId < reputation.lowerGroupId ||
            groupId > reputation.upperGroupId
        ) {
            revert OutOfGroupIdRange(
                reputation.lowerGroupId,
                reputation.upperGroupId
            );
        }
        semaphore.createGroup(groupId, depth, reputation.admin);
    }

    function createGroup(
        uint256 reputationId,
        uint256 groupId,
        uint256 depth,
        uint256 merkleTreeRootDuration
    ) external onlyReputationAdmin(reputationId) {
        Reputation memory reputation = _reputations[reputationId];
        if (
            groupId < reputation.lowerGroupId ||
            groupId > reputation.upperGroupId
        ) {
            revert OutOfGroupIdRange(
                reputation.lowerGroupId,
                reputation.upperGroupId
            );
        }
        semaphore.createGroup(
            groupId,
            depth,
            reputation.admin,
            merkleTreeRootDuration
        );
    }
}
