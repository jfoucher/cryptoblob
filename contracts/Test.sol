pragma solidity ^0.4.0;

contract Test {
    address owner;
    address me;
    string stuff;
    function Test() public {
        owner = msg.sender;
    }

    function setStuff(string _st) public {
        stuff = _st;

    }

    function getStuff() public view returns(string){
        return stuff;
    }
    function setMe() public {
        me = msg.sender;
    }
    function whose() public returns(address) {
        return owner;
    }
}
