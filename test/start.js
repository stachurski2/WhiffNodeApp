const chai = require("chai");
const express = require('express');
const authentication = require('../utils/authentication');
const UserController = require('../controllers/userController');
const { expect } = require("chai");
const sinon = require("sinon");
const User = require("../model/user");

function testLogin(email, password, expectedStatusCode, done) {
    const req = {
        body: {
            "email":email,
            "password":password
        }
    }

    const res = {
        send: function(){},
        json: function(d) {
            console.log("\n : " + d);;
        },
        status: function(s) {
            this.statusCode = s;
            return this;
        }
    }

   sinon.stub(User, 'findOne')
    User.findOne.returns(null);

    UserController.login(req, res, () => {}).then(function(result) {
        chai.expect(res.statusCode).to.equal(expectedStatusCode);
        done();
    })

    User.findOne.restore();


}

describe('UserController - login', async function()  {
    it('sent nothing', function(done){
        testLogin(null, null, 400, done);
    });

    it('sent email only', function(done){
        testLogin("test@test.com", null, 400, done);
    });

    it('sent email and password', function(done){
        testLogin("test@test.com", "tester", 403, done);
    });
});





