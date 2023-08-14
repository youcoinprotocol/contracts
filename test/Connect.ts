/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable jest/valid-expect */
import { Group } from "@semaphore-protocol/group";
import { Identity } from "@semaphore-protocol/identity";
import { FullProof, generateProof } from "@semaphore-protocol/proof";
import { expect } from "chai";
import { constants, Signer } from "ethers";
import { ethers, run } from "hardhat";
import { YOURegistry, Semaphore } from "../build/typechain";
import { createIdentityCommitments } from "./utils";

describe("Connecting Registry with Semaphore", () => {
  let registryContract: YOURegistry;
  let semaphoreContract: Semaphore;
  let signers: Signer[];
  let accounts: string[];

  const treeDepth = Number(process.env.TREE_DEPTH) || 20;
  const groupId = 1000;
  const group = new Group(groupId, treeDepth);
  const members = createIdentityCommitments(3);
  const reputationId = 1000;
  const reputationName = "YOU";
  const reputationURI = "https://www.youcoin.org/";

  before(async () => {
    const { registry } = await run("deploy:registry", {
      logs: false,
    });
    const { semaphore, pairingAddress } = await run("deploy:semaphore", {
      logs: false,
    });

    registryContract = registry;
    semaphoreContract = semaphore;

    signers = await run("accounts", { logs: false });
    accounts = await Promise.all(
      signers.map((signer: Signer) => signer.getAddress())
    );
  });

  describe("# set semaphore address", () => {
    it("Should not set semaphore address by public", async () => {
      const transaction = registryContract
        .connect(signers[1])
        .updateSemaphore(semaphoreContract.address);
      await expect(transaction).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });

    it("Should set semaphore address", async () => {
      await registryContract.updateSemaphore(semaphoreContract.address);
    });
  });

  describe("# update registry", () => {
    it("Should not set registry address by public", async () => {
      const transaction = semaphoreContract
        .connect(signers[1])
        .updateRegistry(registryContract.address);
      await expect(transaction).to.be.revertedWithCustomError(
        semaphoreContract,
        "NotRegistry"
      );
    });

    it("Should set registry address", async () => {
      await semaphoreContract.updateRegistry(registryContract.address);
    });
  });

  describe("# createGroup", () => {
    before(async () => {
      await registryContract.addReputation(
        reputationId,
        accounts[1],
        reputationName,
        reputationURI,
        1000,
        1999
      );
    });

    it("Should create group", async () => {
      const transaction = registryContract
        .connect(signers[1])
        ["createGroup(uint256,uint256,uint256)"](
          reputationId,
          groupId,
          treeDepth
        );
      await expect(transaction)
        .to.emit(semaphoreContract, "GroupCreated")
        .withArgs(groupId, treeDepth, group.zeroValue);
      await expect(transaction)
        .to.emit(semaphoreContract, "GroupAdminUpdated")
        .withArgs(groupId, constants.AddressZero, accounts[1]);
    });

    it("Should not create group by public", async () => {
      const groupId = 1002;
      const transaction = registryContract
        .connect(signers[2])
        ["createGroup(uint256,uint256,uint256)"](
          reputationId,
          groupId + 1,
          treeDepth
        );
      await expect(transaction).to.be.revertedWithCustomError(
        registryContract,
        "NotReputationAdmin"
      );
    });

    it("Should create group with a custom Merkle tree root expiration", async () => {
      const groupId = 1003;
      const group = new Group(groupId);
      const transaction = registryContract
        .connect(signers[1])
        ["createGroup(uint256,uint256,uint256,uint256)"](
          reputationId,
          groupId,
          treeDepth,
          5 // 5 seconds.
        );

      await expect(transaction)
        .to.emit(semaphoreContract, "GroupCreated")
        .withArgs(groupId, treeDepth, group.zeroValue);
      await expect(transaction)
        .to.emit(semaphoreContract, "GroupAdminUpdated")
        .withArgs(groupId, constants.AddressZero, accounts[1]);
    });

    it("Should not create group with a custom Merkle tree root expiration by public", async () => {
      const groupId = 1004;
      const transaction = registryContract
        .connect(signers[2])
        ["createGroup(uint256,uint256,uint256,uint256)"](
          reputationId,
          groupId + 1,
          treeDepth,
          5
        );
      await expect(transaction).to.be.revertedWithCustomError(
        registryContract,
        "NotReputationAdmin"
      );
    });
  });

  describe("# updateGroupAdmin", () => {
    it("Should not update a group admin if the caller is not the group admin", async () => {
      const transaction = semaphoreContract.updateGroupAdmin(
        groupId,
        accounts[0]
      );

      await expect(transaction).to.be.revertedWithCustomError(
        semaphoreContract,
        "Semaphore__CallerIsNotTheGroupAdmin"
      );
    });

    it("Should update the group admin", async () => {
      const transaction = semaphoreContract
        .connect(signers[1])
        .updateGroupAdmin(groupId, accounts[0]);

      await expect(transaction)
        .to.emit(semaphoreContract, "GroupAdminUpdated")
        .withArgs(groupId, accounts[1], accounts[0]);
    });
  });

});
