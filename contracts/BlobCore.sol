pragma solidity ^0.4.18;

import "./BlobFood.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";

// core of the game, defines Blob data structure
// and so on
contract BlobCore is Ownable {
    using SafeMath for uint256;
    //All the blobs ever created
    Blob[] blobs;
    uint256 blobPrice = 10 finney;
    uint256 priceFactor = 6;
    
    //The foods we have, stored in separate contracts
    address[] foods;
    //Maps Blobs indices to their owner
    mapping (uint256 => address) public blobIndexToOwner;
    mapping (uint256 => string) public names;

    //the main blob data structure
    struct Blob {
        uint256 price;
        uint64 dna;
        uint64 birth;
        //These dates are all relative to the birth
        uint32 lastFed;
        uint32 lastPlayed;
        uint8 health;
        uint8 satiety;
        uint8 happy;
    }

    event Log(string name, uint value);
    event NewFood(bytes32 name, uint8 style, uint256 price);
    event CreatedBlob(address owner, uint64 dna, uint8 health, uint8 satiety, uint8 happy, string name, uint id, uint price);
    event LogBoughtBlob(address buyer, address seller, uint value, uint id);
    event LogFedBlob(uint256 blobId, address owner, uint256 foodId, bytes32 foodName, uint256 foodPrice, uint8 happyFactor, uint8 healthFactor, uint8 satietyFactor);
    // event LogBlob(string location, uint64 birth, uint32 lastFed, uint32 lastPlayed, uint8 health, uint8 satiety, uint8 happy);
    // event LogBlobInt(string location, int health, int satiety, int happy);


    function BlobCore() {
        //Create food contracts here ?
    }

    function getBlobCount() public view returns (uint256) {
        return blobs.length;
    }

    function createFood(bytes32 _name, uint8 _style, uint256 _price) external onlyOwner {
        address newFood = new BlobFood(_name, _style, _price);
        foods.push(newFood);
        NewFood(_name, _style, _price);
    }

    function getFoodsCount() public view returns(uint256){
        return foods.length;
    }

    function getFood(uint256 _id) public view returns(bytes32 name, uint256 price, uint8 happyFactor, uint8 healthFactor, uint8 satietyFactor, uint256 id){
        require(_id < foods.length);
        BlobFood food = BlobFood(foods[_id]);
        (name, price, happyFactor, healthFactor, satietyFactor) = food.details();
        id = _id;
    }

    function feedBlob(uint256 _blobid, uint256 _foodid) public payable {
        //Calculate time since last fed, and therefore satiety, and change health, satiety and happy according to what was fed
        require(_blobid < blobs.length);
        Blob storage blob = blobs[_blobid];
        require(blob.health > 0 );
        require(_foodid < foods.length);
        BlobFood food = BlobFood(foods[_foodid]);
        bytes32 foodName;
        uint256 foodPrice;
        uint8 happyFactor;
        uint8 healthFactor;
        uint8 satietyFactor;
        uint8 newHealth;
        uint8 newHappy;
        uint8 newSatiety;
        // LogBlob('feedBlob first', blob.birth, blob.lastFed, blob.lastPlayed, blob.health, blob.satiety, blob.happy);
        (foodName, foodPrice, happyFactor, healthFactor, satietyFactor) = food.details();
        require(msg.sender == blobIndexToOwner[_blobid]);
        require (msg.value >= foodPrice);
        
        (newHealth, newHappy, newSatiety) = _calcStatsFromFood(blob, happyFactor, healthFactor, satietyFactor);
        // LogBlob('feedBlob second',  blob.birth, blob.lastFed, blob.lastPlayed,newHealth, newSatiety, newHappy);
        blob.satiety = newSatiety;
        blob.health = newHealth;
        blob.happy = newHappy;
        blob.lastFed = uint32(now - blob.birth);
        blob.lastPlayed = uint32(now - blob.birth);
        // LogBlob('feedBlob third',  blob.birth, blob.lastFed, blob.lastPlayed,newHealth, newSatiety, newHappy);
        LogFedBlob(_blobid, msg.sender, _foodid, foodName, foodPrice, happyFactor, healthFactor, satietyFactor);
    }

    function playBlob(uint _id) public {
        //Calculate time since last fed, and therefore satiety, and change health, satiety and happy according to what was fed
        Blob storage blob = blobs[_id];
        require((msg.sender == blobIndexToOwner[_id] || msg.sender == owner) && uint64(blobs[_id].dna) > 0);
        blob.lastPlayed = uint32(now - blob.birth);
        if(blob.happy < 235){
            blob.happy += 20;
        } else {
            blob.happy = 255;
        }
    }

    //Get blob for public access
    function getBlob(uint _blobid) public view returns (
        address owner,
        uint8 health,
        uint8 satiety,
        uint8 happy,
        string name,
        uint256 id,
        uint256 bprice,
        uint64 birth
    ) {
        Blob storage blob = blobs[_blobid];
        // Log('Health before', uint(health));
        health = blob.health;
        satiety = blob.satiety;
        happy = blob.happy;
        (health, satiety, happy) = _calcHealth(blob);
        // Log('Health after', uint(health));
        (health, satiety, happy) = _getPercentages(health, satiety, happy);
        
        owner = blobIndexToOwner[_blobid];
        name = names[_blobid];
        id = _blobid;
        bprice = blob.price;
        //Hide the birth date from clients
        if(blob.birth < uint64(now) && uint256(uint64(now)) == now) {
            birth = blob.birth;
        } else {
            birth = 0;
        }
    }

    function setBlobName(uint256 _blobId, string _name) public {
        require(blobIndexToOwner[_blobId] == msg.sender);
        names[_blobId] = _name;
    }


    function getFullBlob(uint256 _blobid) public view onlyOwner returns (
        address owner,
        uint64 dna,
        uint8 nhe,
        uint8 nsa,
        uint8 nha,
        uint64 birth,
        string name,
        uint256 id,
        uint256 bprice,
        uint32 lastFed,
        uint32 lastPlayed
    ){
        (nhe, nha, nsa) = _calcHealth(blobs[_blobid]);
//        nhe = uint8(keccak256(now+uint(dna)));
        owner = blobIndexToOwner[_blobid];
        dna = blobs[_blobid].dna;
        // no Blob can be born after 2038
        if(uint256(uint64(now)) == now) {
            birth = blobs[_blobid].birth;
        } else {
            birth = 0;
        }
        name = names[_blobid];
        id = _blobid;
        bprice = blobs[_blobid].price;
        lastFed = blobs[_blobid].lastFed;
        lastPlayed = blobs[_blobid].lastPlayed;
    }

    function generateBlob(uint256 seed) public onlyOwner {
        uint64 dna = uint64(keccak256(uint(msg.sender) + now + seed + uint(block.blockhash(block.number - blobs.length))));
        // if special
        uint8 f = 1;
        if(uint16(dna % (2**16)) > 64225) {
            f = 10;
        }
        //Set semi random price, we have control over this
        uint256 p = (mulmod(uint256(dna), 1000, 100000000) + 100000) * 1000000000 * priceFactor * f / 12;
        //Set birth two years from now by default
        // Not 2038 yet

        _generateBlob(uint32(now + 3600*24*365*2) * 2, p, dna);
    }



    function createBlob() public payable {
        require(msg.value >= blobPrice);
        uint64 dna = uint64(keccak256(uint256(msg.sender) + now));
        //Between 10 and 20 minutes before they are born.
        _generateBlob(uint32(now + uint(dna) / 1024 % 600 + 600), 100000 ether, dna);
    }


    function getPrice() public view returns(uint) {
        return blobPrice;
    }

    function setPrice(uint _newPrice) public onlyOwner {
        blobPrice = _newPrice;
    }

    function setBlobPrice(uint _id, uint _newPrice) public {
        require(blobIndexToOwner[_id] == msg.sender || owner == msg.sender);
        blobs[_id].price = _newPrice;
    }

    function setBirth(uint _id, uint _birth) public onlyOwner {
        blobs[_id].birth = uint64(_birth);
    }

    function buyBlob(uint _id) public payable {
        Blob storage blob = blobs[_id];
        require(msg.value >= blob.price && uint(blob.dna) > 0);
        // require(numOwnedBlobs[msg.sender] <= 2);
        if(blobIndexToOwner[_id] == owner) {
            //We used to own this one, set birth date to soon
            uint32 bdate = uint32(now + (uint(blob.dna) / 1024) % 600 + 600);
            blob.birth = bdate;
            blob.lastFed = 0;
            blob.lastPlayed = 0;
        }
        address oldOwner = blobIndexToOwner[_id];
        // balances[oldOwner] += msg.value;
        oldOwner.transfer(msg.value);
        blobIndexToOwner[_id] = msg.sender;
        blob.price = 100000 ether;
        LogBoughtBlob(msg.sender, oldOwner, msg.value, _id);
    }

    function setPriceFactor(uint _factor) public onlyOwner {
        priceFactor = _factor;
    }


    function () public payable {

    }


    function _generateBlob(uint32 _birth, uint256 _blobPrice, uint64 _dna) private returns(uint256) {
        Blob memory blob = Blob(
            _blobPrice,
            _dna,
            _birth,
            0,
            0,
            255,
            255,
            255
        );
        uint256 blobId = blobs.push(blob) - 1 ;

        blobIndexToOwner[blobId] = msg.sender;
        CreatedBlob(
            msg.sender,
            _dna,
            blob.health,
            blob.satiety,
            blob.happy,
            names[blobId],
            blobId,
            _blobPrice
        );
        return blobId;
    }


    //Convert uint8 to a percentage
    function _getPercentages(uint8 nhe, uint8 nha, uint8 nsa) pure public returns(
        uint8 health,
        uint8 satiety,
        uint8 happy
    ) {
        health = uint8(uint(nhe) * 1000 / 2550);
        satiety = uint8(uint(nsa) * 1000 / 2550);
        happy = uint8(uint(nha) * 1000 / 2550);
    }

    // The needs of this particular blob
    function _getWants(uint64 _dna) internal pure returns(uint256 wantPlay, uint256 wantEat) {
        // This represents the number of seconds it takes for this blob to lose one point or happy or satiety
        // 3 days to 0 satiety approximately or 970 seconds per point lost. Approx 30% genetic variance
        wantEat = (_dna / (4**16)) % 300 + 670;
        //They become sad a bit quicker
        wantPlay = (_dna / (2**16)) % 200 + 550;
    }

    //Factors to calculate current state of blob
    function _getFactors(Blob blob, uint256 d) internal pure returns(uint256 te, uint256 tb) {
        uint256 wantPlay; 
        uint256 wantEat;
        (wantPlay, wantEat) = _getWants(blob.dna);
        // if lastFed or lastPlayed is in the future, the factors are zero
        // b and c are between 0 and a lot.
        uint256 b = uint256(blob.lastFed) + uint256(blob.birth) > d ? 0 : d - uint256(blob.lastFed) - uint256(blob.birth);
        uint256 c = uint256(blob.lastPlayed) + uint256(blob.birth) > d ? 0 : d - uint256(blob.lastPlayed) - uint256(blob.birth);

        // The factors are the time elasped since last played / fed divided by a dna dependent factor
        // They are between 0 and a high number
        te = b / wantEat;
        tb = c / wantPlay;
    }

    // Calculate the current state of a blob
    function _calcHealth(
        Blob blob
    ) view internal returns(
        uint8 health,
        uint8 happy,
        uint8 satiety
    ) {
        uint te;
        uint tb;
        (te, tb) = _getFactors(blob, block.timestamp);
        uint8 max = 2**8 - 1;
        uint256 remEat = 0;
        uint256 remPlay = 0;
        uint256 remHealth = 0;

        if(te > max ) {
            // Set a maximum if time since last fed was really long
            remEat = max;
            remHealth = (te - max) >= max ? max : te - max;
        } else {
            // Otherwise make sure it is between 0 and 255
            remEat = te % max;
        }

        if(tb > max ) {
            //Set a maximum if time since last played was really long
            remPlay = max;
            remHealth += (tb - max) >= max ? max : tb - max;
        } else {
            // Otherwise make sure it is between 0 and 255
            remPlay = tb % max;
        }

        // If blob is very old, remove health quicker
        if (blob.birth < block.timestamp - 60*60*24*30) {
            remHealth = remHealth + (block.timestamp - blob.birth) / (60*60*24*30) >= max ? max : remHealth + (block.timestamp - blob.birth) / (60*60*24*30);
        }


        happy = (remPlay >= blob.happy) ? 0 : blob.happy - uint8(remPlay);
        satiety = (remEat >= blob.satiety) ? 0 : blob.satiety - uint8(remEat);
        health = (remHealth >= blob.health) ? 0 : blob.health - uint8(remHealth);
    }


    function _calcStatsFromFood(Blob blob, uint8 happyFactor, uint8 healthFactor, uint8 satietyFactor) private view returns(
        uint8 newHealth,
        uint8 newHappy,
        uint8 newSatiety
    ){
        int tmpHealth;
        int tmpHappy;
        int tmpSatiety;

        (newHealth, newHappy, newSatiety) = _calcHealth(blob);
        // LogBlob('_calcStatsFromFood first', blob.birth, blob.lastFed, blob.lastPlayed, newHealth, newSatiety, newHappy);
        //TODO depending what we feed, change health and satiety accordingly.
        //Factors go from 0 to 3;
        // If they are 2 or above, they act positively,
        // If 1 they do nothing
        // If they are 0 they act negatively
        //DNA factor is taken care of elsewhere
        //No negative value for satiety.
        tmpSatiety = int(newSatiety) + 10 * int(satietyFactor);
        if(tmpSatiety >= 255) {
            //He's full, so lower health depending on how full they are
            tmpHealth = tmpHealth - int(tmpSatiety - 255)/128;
        }
        tmpHealth = int(newHealth) + 8 * (int(healthFactor) - 1);
        tmpHappy = int(newHappy) + 8 * (int(happyFactor) - 1);
        // LogBlobInt('_calcStatsFromFood second', tmpHealth, tmpSatiety, tmpHappy);
        //Check for out of bounds exceptions
        if(tmpHealth > 255) tmpHealth = 255;
        if(tmpHappy > 255) tmpHappy = 255;
        if(tmpSatiety > 255) tmpSatiety = 255;
        if(tmpHealth < 0) tmpHealth = 0;
        if(tmpHappy < 0) tmpHappy = 0;
        if(tmpSatiety < 0) tmpSatiety = 0;
        //And cast explicitely before return
        newHealth = uint8(tmpHealth);
        newHappy = uint8(tmpHappy);
        newSatiety = uint8(tmpSatiety);
        // LogBlob('_calcStatsFromFood third', blob.birth, blob.lastFed, blob.lastPlayed, newHealth, newSatiety, newHappy);
    }


}