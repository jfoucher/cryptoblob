pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/ownership/HasNoTokens.sol";

//Some food for your blobs. Should not own any tokens
contract BlobFood is HasNoTokens {

    bytes32 name;
    uint8 style;
    uint256 price;

    function BlobFood(bytes32 _name, uint8 _style, uint256 _price) public {
        name = _name;
        style = _style;
        price = _price;
    }

    function details() public view onlyOwner returns(bytes32 _name, uint256 _price, uint8 happyFactor, uint8 healthFactor, uint8 satietyFactor) {
        _name = name;
        _price = price;
        (happyFactor, healthFactor, satietyFactor) = _getFoodValues(style);
    }

    function _getFoodValues(uint _foodStyle) internal pure returns(
        uint8 happyFactor,
        uint8 healthFactor,
        uint8 satietyFactor
    ) {
        satietyFactor = uint8(_foodStyle % 4); //Last two bits for satiety factor
        healthFactor = uint8((_foodStyle / 4) % 4); //Next two bits for health factor
        happyFactor = uint8((_foodStyle / 2**4) % 4); //Next two bits for happy factor
    }

}