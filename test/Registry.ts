/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable jest/valid-expect */
import { Group } from "@semaphore-protocol/group";
import { Identity } from "@semaphore-protocol/identity";
import { FullProof, generateProof } from "@semaphore-protocol/proof";
import { expect } from "chai";
import { constants, Signer } from "ethers";
import { ethers, run } from "hardhat";
import { YOURegistry } from "../build/typechain";
import { createIdentityCommitments } from "./utils";

describe("Registry", () => {
  let registryContract: YOURegistry;
  let signers: Signer[];
  let accounts: string[];

  const reputationId = 1000;
  const reputationName = "YOU";
  const reputationURI = "https://www.youcoin.org/";


  before(async () => {
    const { registry } = await run("deploy:registry", {
      logs: false,
    });

    registryContract = registry;

    signers = await run("accounts", { logs: false });
    accounts = await Promise.all(
      signers.map((signer: Signer) => signer.getAddress())
    );
  });

  describe("# addReputation", () => {
    it("Should add reputation", async () => {
      const transaction = registryContract.addReputation(
        reputationId,
        accounts[1],
        reputationName,
        reputationURI,
        1000,
        1999
      );

      await expect(transaction)
        .to.emit(registryContract, "ReputationAdded")
        .withArgs(reputationId, reputationName);
    });

    it("Should not add reputation if it exists", async () => {
      const transaction = registryContract.addReputation(
        reputationId,
        accounts[1],
        reputationName,
        reputationURI,
        1000,
        1999
      );

      await expect(transaction).to.be.revertedWithCustomError(
        registryContract,
        "ReputationIdAlreadyExists"
      );
    });

    it("Should not add reputation by public", async () => {
      const transaction = registryContract
        .connect(signers[1])
        .addReputation(
          reputationId + 1,
          accounts[1],
          reputationName,
          reputationURI,
          1000,
          1999
        );

      await expect(transaction).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });
  });

  describe("# updateReputation", () => {
    it("Should not update reputationURI by public", async () => {
      const transaction = registryContract
        .connect(signers[0])
        .updateReputationURI(reputationId, "https://hello.world");

      await expect(transaction).to.be.revertedWithCustomError(
        registryContract,
        "NotReputationAdmin"
      );
    });

    it("Should update reputationURI", async () => {
      const newURI = "https://hello.world";
      await registryContract
        .connect(signers[1])
        .updateReputationURI(reputationId, "https://hello.world");
      const info = await registryContract.reputationInfo(reputationId);
      expect(info.name).to.equal(reputationName);
      expect(info.contentURI).to.equal(newURI);
    });

    it("Should not update reputation admin by public", async () => {
      const transaction = registryContract
        .connect(signers[2])
        .updateReputationAdmin(reputationId, accounts[2]);
      await expect(transaction).to.be.revertedWithCustomError(
        registryContract,
        "NotReputationAdmin"
      );
    });

    it("Should update reputation admin", async () => {
      await registryContract
        .connect(signers[1])
        .updateReputationAdmin(reputationId, accounts[2]);

      await registryContract
        .connect(signers[2])
        .updateReputationURI(reputationId, reputationURI);
      const info = await registryContract.reputationInfo(reputationId);
      expect(info.name).to.equal(reputationName);
      expect(info.contentURI).to.equal(reputationURI);
    });
  });

  describe("# removeReputation", () => {
    it("Should not remove reputation by public", async () => {
      const transaction = registryContract
        .connect(signers[1])
        .removeReputation(reputationId);

      await expect(transaction).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });

    it("Should remove reputation", async () => {
      const transaction = registryContract.removeReputation(reputationId);

      await expect(transaction)
        .to.emit(registryContract, "ReputationRemoved")
        .withArgs(reputationId, reputationName);
    });

    it("Should not remove non existent reputation", async () => {
      const transaction = registryContract.removeReputation(reputationId);

      await expect(transaction).to.be.revertedWithCustomError(
        registryContract,
        "ReputationDoesNotExists"
      );
    });
  });
});
