const chai = require("chai");
const express = require('express');
const authentication = require('../utils/authentication');
const UserController = require('../controllers/userController');
const { expect } = require("chai");
const sinon = require("sinon");
const User = require("../model/user");
const bcrypt = require('bcryptjs');
const Authentication = require("../utils/authentication");
const Sequelize = require('sequelize');


describe('UserController - register', async function()  {
    it('sent nothing', function(done){
        testLogin(null, null, 400, done);
    });

    it('sent email only', function(done){
        testLogin("test@test.com", null, 400, done);
    });

    it('sent email and password, user does not exist', function(done){
        sinon.stub(User, 'findOne')
        User.findOne.resolves(null);
        testLogin("test@test.com", "tester", 403, done);
        User.findOne.restore();
    });

    it('sent email and password, user exists, wrong password', function(done){
        const testEmail = "test@test.com"
        const password = "tester"
        const truePassword = "tester1"

        bcrypt.hash(truePassword, 12).then(function(passwordHash){
            sinon.stub(User, 'findOne')
            User.findOne.resolves({
                "id":0,
                "email":testEmail,
                "passwordHash":passwordHash})
            testLogin(testEmail, password, 401, done);
             User.findOne.restore();
        });  
    });

    it('sent email and password, user exists, good password', function(done){
        const testEmail = "test@test.com"
        const password = "tester"
        const truePassword = "tester"

        bcrypt.hash(truePassword, 12).then(function(passwordHash){
            sinon.stub(User, 'findOne')
            User.findOne.resolves({
                "id":0,
                "email":testEmail,
                "passwordHash":passwordHash})
            testLogin(testEmail, password, 200, done);
             User.findOne.restore();
        });  
    });
});

describe('UserController - register', async function()  {
    it('sent nothing', function(done){
        testRegister(null, null, 400, done);
    });

    it('sent email only', function(done){
        testRegister("test@test.com", null, 400, done);
    });


    it('sent email, password shorter than 3 characters', function(done){
        testRegister("test@test.com", "12", 400, done);
    });

    it('sent incorrect email, password ok', function(done){
        testRegister("testest.com", "abcdef", 400, done);
    });

    it('sent correct email, password ok, user already exists', function(done){
        const testEmail = "test@test.com"
        const password = "tester"
        sinon.stub(User, 'findOne')
        User.findOne.resolves({
                "id":0,
                "email":testEmail,
                "passwordHash":password})
        testRegister(testEmail, password, 409, done);
       User.findOne.restore();
    });

    it('sent correct email, password ok, user does not exist',  function(done){
        const testEmail = "test@test.com"
        const password = "tester"
        
        const stub1 = sinon.stub(Sequelize.Model, 'findOne')

        const stub2 = sinon.stub(Sequelize.Model, 'create')

        User.findOne.resolves(null)
        stub2.resolves({"id":0});
        testRegister(testEmail, password, 201, () => {
            done();
            stub1.restore();
            stub2.restore();
        });
    });

    it('sent correct email, password ok, user does not exist but database cannot create new one',  function(done){
        const testEmail = "test@test.com"
        const password = "tester"
        const stub1 = sinon.stub(User, 'findOne')
        const stub2 = sinon.stub(Sequelize.Model, 'create')
        stub1.resolves(null)
        stub2.resolves(null);
        testRegister(testEmail, password, 500, () => {
            done();
            stub1.restore();
            stub2.restore();
        });
    });
});

function testLogin(email, password, expectedStatusCode, done) {
    const req = {
        body: {
            "email":email,
            "password":password
        }
    }

    const res = {
        send: function(){},
        json: function(d) {},
        status: function(s) {
            this.statusCode = s;
            return this;
        }
    }

    UserController.login(req, res, () => {}).then( function(result) {
        chai.expect(res.statusCode).to.equal(expectedStatusCode);
        done();
    })
}

function testRegister(email, password, expectedStatusCode, done) {
    const req = {
        body: {
            "email":email,
            "password":password
        }
    }

    const res = {
        send: function(){},
        json: function(d) {},
        status: function(s) {
            this.statusCode = s;
            return this;
        }
    }
    UserController.registerUser(req, res, () => {}).then(function(result) {
        chai.expect(res.statusCode).to.equal(expectedStatusCode);
        done();
    })
    
}




