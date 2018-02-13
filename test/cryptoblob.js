var CryptoBlob = artifacts.require("./BlobCore.sol");

contract('CryptoBlob', function (accounts) {
    it("should have one blob", function () {
        return CryptoBlob.deployed().then(function (instance) {
            return instance.getBlobCount.call();
        }).then(function (cnt) {
            assert.equal(cnt.valueOf(), 0, "There are blobs here");
        });
    });
    it("should add one blob if paid enough", async function () {
        var meta = await CryptoBlob.deployed();
        var blobCount = await meta.getBlobCount();
        const transaction = {
            from: accounts[0],
            value: web3.toWei(10, 'finney'),
        };
        var r = await meta.createBlob(transaction);
        var blobId = r.valueOf().logs[0].args.id.toNumber();
        blobCount = await meta.getBlobCount();
        assert.equal(blobCount.toNumber(), 1, "There is not the right number of blobs");
        // console.log('BLOBID-------------------', blobId);
        var blob = await meta.getBlob(blobId);
        // console.log('GOT BLOB', blob);
        //assert.equal(blob[0], accounts[0], "Blob does not belong to the right owner");
    });

    it("should not add one blob if not paid enough", async function () {
        var meta = await CryptoBlob.deployed();
        var oldBlobCount = await meta.getBlobCount();
        const transaction = {
            from: accounts[0],
            value: web3.toWei(1, 'finney'),
        };
        try {
            var r = await meta.createBlob(transaction);
        } catch(e) {
            
        }
        
        blobCount = await meta.getBlobCount();
        assert.equal(blobCount.toNumber(), oldBlobCount.toNumber(), "There is not the right number of blobs");
    });

    it("should generate free blob for owner", async function(){
        var meta = await CryptoBlob.deployed();
        var oldBlobCount = await meta.getBlobCount();

        var r = await meta.generateBlob();
        var blobId = r.valueOf().logs[0].args.id.toNumber();
        var newBlobCount = await meta.getBlobCount();
        assert.equal(newBlobCount.toNumber(), oldBlobCount.toNumber() + 1, "Blob not created");
    });

    it("should not generate free blob for someone else", async function(){
        var meta = await CryptoBlob.deployed();
        var oldBlobCount = await meta.getBlobCount({from: accounts[1]});

        try {
            var r = await meta.generateBlob({from: accounts[1]});
        } catch(e) {
            // console.log("Sorry you can't do that. Only the owner of the contract can generate blobs");
        }

        var newBlobCount = await meta.getBlobCount({from: accounts[1]});
        assert.equal(newBlobCount.toNumber(), oldBlobCount.toNumber(), "Blob created anyway");
    });

    it("should change price if is owner", async function(){
        var meta = await CryptoBlob.deployed();

        var priceChange = await meta.setPrice(web3.toWei(1, 'finney'));

        var newPrice = await meta.getPrice();
        assert.equal(newPrice.toNumber(), 1000000000000000, "Price is not changed");
    });


    it("should not change price if from another address", async function(){
        var meta = await CryptoBlob.deployed();
        var oldPrice = await meta.getPrice();
        try {
            var priceChange = await meta.setPrice(web3.toWei(1, 'finney'), {from: accounts[1]});
        } catch(e) {
            // console.log('Sorry you can\'t do that. Only the owner of the contract can change the price');
        }

        var newPrice = await meta.getPrice();
        assert.equal(newPrice.toNumber(), oldPrice.toNumber(), "Price is changed !");
    });


    it("should vary dna", async function(){
        var meta = await CryptoBlob.deployed();
        const transaction = {
            from: accounts[0],
            value: web3.toWei(1, 'finney'),
        };

        for(var i=0;i < 5;i++) {
            var r = await meta.createBlob(transaction);
            // console.log('ORIG', r.logs[0].args.dna.toString());
        }
    });

    it("should have everything at 100%", async function(){
        var meta = await CryptoBlob.deployed();
        const transaction = {
            from: accounts[0],
            value: web3.toWei(10, 'finney'),
        };
        var r = await meta.createBlob(transaction);
        var r3 = await meta.getBlob(r.logs[0].args.id.toNumber());
        assert.equal(r3[1].toNumber(), 100, "Health not 100% !");
        assert.equal(r3[2].toNumber(), 100, "Satiety not 100% !");
        assert.equal(r3[3].toNumber(), 100, "Happy not 100% !");
    });

    it("should lower satiety", async function(){
        var meta = await CryptoBlob.deployed();
        const transaction = {
            from: accounts[0],
            value: web3.toWei(10, 'finney'),
        };
        try {
            var r = await meta.createBlob(transaction);
        }catch (e) {
            // console.log('could not create blob');
        }
        try {
            var f = await meta.setBirth(r.logs[0].args.id.toNumber(), (Date.now() - 1000*60*30)/1000);
        }catch (e) {
            // console.log('could not set birth');
        }
        try {
            var r3 = await meta.getBlob(r.logs[0].args.id.toNumber());
        }catch (e) {
            // console.log('could not get blob');
        }
        
        // var r2 = await meta.feedBlob(r.logs[0].args.id.toNumber(),0, transaction);
        // console.log(r3);
        assert.isBelow(r3[2].toNumber(), 100, "Satiety not changed !");
    });

    it("Should return lower satiety progressively", async function(){
        var meta = await CryptoBlob.deployed();
        const transaction = {
            from: accounts[0],
            value: web3.toWei(10, 'finney'),
        };
        var r = await meta.createBlob(transaction);
        var f = await meta.setBirth(r.logs[0].args.id.toNumber(), (Date.now()/1000 - 60*60*12));
        var r3 = await meta.getBlob(r.logs[0].args.id.toNumber());
        assert.isBelow(r3[2].toNumber(), 100, "Satiety not changed !");

        var f2 = await meta.setBirth(r.logs[0].args.id.toNumber(), (Date.now()/1000 - 60*60 * 24 * 4));
        var r4 = await meta.getBlob(r.logs[0].args.id.toNumber());
        assert.isBelow(r4[2].toNumber(), r3[2].toNumber(), "Satiety not lower than before !");
        assert.isBelow(r4[1].toNumber(), r3[1].toNumber(), "Health not lower than before !");
    });

    it("should set satiety to zero", async function(){
        var meta = await CryptoBlob.deployed();
        const transaction = {
            from: accounts[0],
            value: web3.toWei(10, 'finney'),
        };
        var r = await meta.createBlob(transaction);
        var f = await meta.setBirth(r.logs[0].args.id.toNumber(), (Date.now()/1000 - 60*60*24*3));
        var r3 = await meta.getBlob(r.logs[0].args.id.toNumber());
        assert.equal(0, r3[2].toNumber(), "Satiety is not zero !");

    });

    it("should not be dead", async function(){
        var meta = await CryptoBlob.deployed();
        const transaction = {
            from: accounts[0],
            value: web3.toWei(10, 'finney'),
        };
        var r = await meta.createBlob(transaction);
        var f = await meta.setBirth(r.logs[0].args.id.toNumber(), (Date.now() - 1000*60*60*24)/1000);
        var r3 = await meta.getBlob(r.logs[0].args.id.toNumber());
        assert.isAbove(r3[1].toNumber(), 0, "He Dead!");
    });

    it("should die after a while", async function(){
        var meta = await CryptoBlob.deployed();
        const transaction = {
            from: accounts[0],
            value: web3.toWei(10, 'finney'),
        };
        var r = await meta.createBlob(transaction);
        var f = await meta.setBirth(r.logs[0].args.id.toNumber(), (Date.now() - 1000*60*60*24*7)/1000);
        var r3 = await meta.getBlob(r.logs[0].args.id.toNumber());
        assert.equal(r3[1].toNumber(), 0, "Not Dead!");
    });

    it("should be able to buy blob", async function(){
        var meta = await CryptoBlob.deployed();
        var r = await meta.generateBlob();
        var blob = await meta.getBlob(r.logs[0].args.id.toNumber());
        const transaction = {
            from: accounts[1],
            value: blob[6],
        };
        var r2 = await meta.buyBlob(r.logs[0].args.id.toNumber(), transaction);
        var blob2 = await meta.getBlob(r.logs[0].args.id.toNumber());
        assert.equal(blob2[0], accounts[1], "Wrong Blob owner");
        assert.equal(blob2[6].toNumber(), web3.toWei(100000, 'ether'), "Wrong Price");
    });

    it("should increase satiety when fed", async function(){
        var meta = await CryptoBlob.deployed();
        var food = meta.createFood('Hamburger', 19, web3.toWei(0.01, 'ether'));
        var r = await meta.generateBlob();
        var foodCount = await meta.getFoodsCount();
        var blob = await meta.getBlob(r.logs[0].args.id.toNumber());
        const transaction = {
            from: accounts[1],
            value: blob[6],
        };
        var r2 = await meta.buyBlob(blob[5].toNumber(), transaction);
        var b = await meta.setBirth(blob[5].toNumber(), Date.now()/1000 - 60*60*24);
        var blob2 = await meta.getBlob(blob[5].toNumber());
        var c = await meta.feedBlob(blob[5].toNumber(), foodCount.toNumber() - 1, {
            from: accounts[1],
            value: web3.toWei(0.01, 'ether'),
        });
        var blob3 = await meta.getBlob(blob[5].toNumber());
        assert.equal(blob3[2].toNumber() > blob2[2].toNumber(), true, "Did not increase satiety");
    });

    it("should decrease health when feeding unhealthy food", async function(){
        var meta = await CryptoBlob.deployed();
        var food = meta.createFood('Candy', 48, web3.toWei(0.001, 'ether'));
        var r = await meta.generateBlob();
        var blob = await meta.getBlob(r.logs[0].args.id.toNumber());

        var foodCount = await meta.getFoodsCount();
        var r2 = await meta.buyBlob(blob[5].toNumber(), {
            from: accounts[1],
            value: blob[6],
        });
        var b = await meta.setBirth(blob[5].toNumber(), Date.now()/1000 - 60*60*24);
        var blob2 = await meta.getBlob(blob[5].toNumber());
        var c = await meta.feedBlob(blob[5].toNumber(), foodCount.toNumber() - 1, {
            from: accounts[1],
            value: web3.toWei(0.001, 'ether'),
        });
        var blob3 = await meta.getBlob(blob[5].toNumber());
        // console.log(blob3[1].toNumber(), blob2[1].toNumber(), blob2[2].toNumber(), blob3[2].toNumber());
        assert.equal(blob3[1].toNumber() < blob2[1].toNumber(), true, "Did not decrease health");
    });

    it("should decrease health when feeding full blob", async function(){
        var meta = await CryptoBlob.deployed();
        var food = meta.createFood('Hamburger', 19, web3.toWei(0.01, 'ether'));
        var r = await meta.generateBlob();
        var blob = await meta.getBlob(r.logs[0].args.id.toNumber(), {from: accounts[1]});

        var foodCount = await meta.getFoodsCount();
        var r2 = await meta.buyBlob(blob[5].toNumber(), {
            from: accounts[1],
            value: blob[6],
        });
        var b = await meta.setBirth(blob[5].toNumber(), Date.now());
        var blob2 = await meta.getBlob(blob[5].toNumber(), {from: accounts[1]});
        var c = await meta.feedBlob(blob[5].toNumber(), foodCount.toNumber() - 1, {
            from: accounts[1],
            value: web3.toWei(0.01, 'ether'),
        });
        var blob3 = await meta.getBlob(blob[5].toNumber(), {from: accounts[1]});
        // console.log(blob3[1].toNumber(), blob2[1].toNumber(), blob2[2].toNumber(), blob3[2].toNumber());
        assert.equal(blob3[1].toNumber() < blob2[1].toNumber(), true, "Did not decrease health");
    });

    it("should increase health when feeding healthy food", async function(){
        var meta = await CryptoBlob.deployed();
        var food = meta.createFood('Medecine', 12, web3.toWei(0.01, 'ether'));
        var r = await meta.generateBlob();
        var blob = await meta.getBlob(r.logs[0].args.id.toNumber());

        var foodCount = await meta.getFoodsCount();
        var r2 = await meta.buyBlob(blob[5].toNumber(), {
            from: accounts[1],
            value: blob[6],
        });
        var b = await meta.setBirth(blob[5].toNumber(), Date.now()/1000-60*60*24*2.5);
        var blob2 = await meta.getBlob(blob[5].toNumber());
        // console.log('blob2', blob2);
        var c = await meta.feedBlob(blob[5].toNumber(), foodCount.toNumber() - 1, {
            from: accounts[1],
            value: web3.toWei(0.01, 'ether'),
        });
        var blob3 = await meta.getBlob(blob[5].toNumber());
        // console.log('blob3', blob3);
        // console.log(blob3[1].toNumber(), blob2[1].toNumber(), blob2[2].toNumber(), blob3[2].toNumber());

        assert.equal(blob3[1].toNumber() > blob2[1].toNumber(), true, "Did not increase health");
    });


    it("should change blob price to what owner sets", async function(){
        var meta = await CryptoBlob.deployed();
        var r = await meta.generateBlob();
        var blob = await meta.getBlob(r.logs[0].args.id.toNumber());

        var r2 = await meta.buyBlob(blob[5].toNumber(), {
            from: accounts[1],
            value: blob[6],
        });
        var blob2 = await meta.getBlob(blob[5].toNumber());
        // console.log('blob2', blob2);
        var c = await meta.setBlobPrice(blob[5].toNumber(), web3.toWei(0.1, 'ether'), {
            from: accounts[1],
        });
        var blob3 = await meta.getBlob(blob[5].toNumber());
        // console.log('blob3', blob3);
        // console.log(blob3[1].toNumber(), blob2[1].toNumber(), blob2[2].toNumber(), blob3[2].toNumber());

        assert.equal(blob3[6].toNumber(), web3.toWei(0.1, 'ether'), "Did not change price");
    });

    it("should not change blob price if not owner", async function(){
        var meta = await CryptoBlob.deployed();
        var r = await meta.generateBlob();
        var blob = await meta.getBlob(r.logs[0].args.id.toNumber());

        var r2 = await meta.buyBlob(blob[5].toNumber(), {
            from: accounts[1],
            value: blob[6],
        });
        var blob2 = await meta.getBlob(blob[5].toNumber());
        // console.log('blob2', blob2);
        try {
            var c = await meta.setBlobPrice(blob[5].toNumber(), web3.toWei(0.1, 'ether'), {
                from: accounts[2],
            });
        } catch (e) {
            
        }
        
        var blob3 = await meta.getBlob(blob[5].toNumber());
        // console.log('blob3', blob3);
        // console.log(blob3[1].toNumber(), blob2[1].toNumber(), blob2[2].toNumber(), blob3[2].toNumber());

        assert.notEqual(blob3[6].toNumber(), web3.toWei(0.1, 'ether'), "Price changed.");
    });

    it("should increase happy when played", async function(){
        var meta = await CryptoBlob.deployed();
        var r = await meta.generateBlob();
        var blob = await meta.getBlob(r.logs[0].args.id.toNumber());
        const transaction = {
            from: accounts[1],
            value: blob[6],
        };
        var r2 = await meta.buyBlob(blob[5].toNumber(), transaction);
        var b = await meta.setBirth(blob[5].toNumber(), Date.now()/1000 - 60*60*24);
        var blob2 = await meta.getBlob(blob[5].toNumber());
        var c = await meta.playBlob(blob[5].toNumber());
        var blob3 = await meta.getBlob(blob[5].toNumber());
        assert.equal(blob3[3].toNumber() > blob2[3].toNumber(), true, "Did not increase happiness");
    });

    it("should have no toys", async function(){
        var meta = await CryptoBlob.deployed();
        var r = await meta.getMyToys();
        assert.equal(r.length, 0, "Wrong number of toys !");
    });

    it("should buy a toy", async function(){
        var meta = await CryptoBlob.deployed();
        var r = await meta.getMyToys();
        const transaction = {
            from: accounts[0],
            value: web3.toWei(15, 'finney'),
        };
        //Buy Laser toy
        var r = await meta.buyToy(0, transaction);
        var r = await meta.getMyToys();
        assert.equal(r.length, 1, "Wrong number of toys !");
        for (var i = 0; i < r.length;i++) {
            var toy = await meta.getToyDetails(r[i]);
            assert.equal(toy[2], 'Laser', "Wrong toy !");
        }
    });

});
