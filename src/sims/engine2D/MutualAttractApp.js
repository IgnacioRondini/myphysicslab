// Copyright 2016 Erik Neumann.  All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

goog.provide('myphysicslab.sims.engine2D.MutualAttractApp');

goog.require('myphysicslab.lab.controls.ChoiceControl');
goog.require('myphysicslab.lab.controls.CheckBoxControl');
goog.require('myphysicslab.lab.controls.NumericControl');
goog.require('myphysicslab.lab.engine2D.ContactSim');
goog.require('myphysicslab.lab.model.DampingLaw');
goog.require('myphysicslab.lab.model.Gravity2Law');
goog.require('myphysicslab.lab.engine2D.Polygon');
goog.require('myphysicslab.lab.engine2D.Shapes');
goog.require('myphysicslab.lab.model.CollisionAdvance');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.view.DisplayShape');
goog.require('myphysicslab.sims.engine2D.Engine2DApp');
goog.require('myphysicslab.sims.layout.CommonControls');
goog.require('myphysicslab.sims.layout.TabLayout');

goog.scope(function() {

var lab = myphysicslab.lab;
var sims = myphysicslab.sims;

var ChoiceControl = lab.controls.ChoiceControl;
var CheckBoxControl = lab.controls.CheckBoxControl;
var NumericControl = lab.controls.NumericControl;
var CollisionAdvance = lab.model.CollisionAdvance;
var CommonControls = sims.layout.CommonControls;
var ContactSim = lab.engine2D.ContactSim;
var DampingLaw = lab.model.DampingLaw;
var DisplayShape = lab.view.DisplayShape;
var DoubleRect = lab.util.DoubleRect;
var Engine2DApp = sims.engine2D.Engine2DApp;
var Gravity2Law = lab.model.Gravity2Law;
var ParameterNumber = lab.util.ParameterNumber;
var Polygon = myphysicslab.lab.engine2D.Polygon;
var Shapes = lab.engine2D.Shapes;
var UtilityCore = lab.util.UtilityCore;
var Vector = lab.util.Vector;

/** Simulation showing several objects experiencing mutual attraction from gravity.

This sim has a config() method which looks at a set of options
and rebuilds the simulation accordingly. UI controls are created to change the options.

* @param {!sims.layout.TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @constructor
* @final
* @struct
* @extends {Engine2DApp}
* @export
*/
sims.engine2D.MutualAttractApp = function(elem_ids) {
  var simRect = new DoubleRect(-6, -6, 6, 6);
  this.mySim = new ContactSim();
  var advance = new CollisionAdvance(this.mySim);
  Engine2DApp.call(this, elem_ids, simRect, this.mySim, advance);
  this.elasticity.setElasticity(0.8);
  this.mySim.setShowForces(false);
  /** @type {!lab.model.DampingLaw} */
  this.dampingLaw = new DampingLaw(0, 0.15, this.simList);
  /** @type {!lab.model.Gravity2Law} */
  this.gravityLaw = new Gravity2Law(2, this.simList);

  /** @type {number} */
  this.numBods = 4;
  /** @type {boolean} */
  this.circleBody = true;

  this.addPlaybackControls();
  /** @type {!lab.util.ParameterNumber} */
  var pn;
  var choices = [];
  var values = [];
  for (var i=2; i<=6; i++) {
    choices.push(i+' '+MutualAttractApp.i18n.OBJECTS);
    values.push(i);
  }
  this.addParameter(pn = new ParameterNumber(this, MutualAttractApp.en.NUMBER_BODIES,
      MutualAttractApp.i18n.NUMBER_BODIES,
      this.getNumBods, this.setNumBods, choices, values));
  this.addControl(new ChoiceControl(pn));

  pn = this.gravityLaw.getParameterNumber(Gravity2Law.en.GRAVITY);
  this.addControl(new NumericControl(pn));
  this.watchEnergyChange(pn);
  pn = this.dampingLaw.getParameterNumber(DampingLaw.en.DAMPING);
  this.addControl(new NumericControl(pn));

  this.addStandardControls();

  this.makeScriptParser();
  this.addURLScriptButton();
  this.config();
  this.graphSetup();
};
var MutualAttractApp = sims.engine2D.MutualAttractApp;
goog.inherits(MutualAttractApp, Engine2DApp);

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  MutualAttractApp.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', dampingLaw: '+this.dampingLaw.toStringShort()
        +', gravityLaw: '+this.gravityLaw.toStringShort()
        + MutualAttractApp.superClass_.toString.call(this);
  };
};

/** @inheritDoc */
MutualAttractApp.prototype.getClassName = function() {
  return 'MutualAttractApp';
};

/** @inheritDoc */
MutualAttractApp.prototype.defineNames = function(myName) {
  MutualAttractApp.superClass_.defineNames.call(this, myName);
  this.terminal.addRegex('gravityLaw|dampingLaw',
       myName);
  this.terminal.addRegex('MutualAttractApp|Engine2DApp',
       'myphysicslab.sims.engine2D', /*addToVars=*/false);
};

/** @inheritDoc */
MutualAttractApp.prototype.getSubjects = function() {
  var subjects = MutualAttractApp.superClass_.getSubjects.call(this);
  return goog.array.concat(this.dampingLaw, this.gravityLaw, subjects);
};

/**
* @param {string} color
* @param {number} index
* @return {!myphysicslab.lab.engine2D.Polygon}
* @private
*/
MutualAttractApp.prototype.makeBody = function(color, index) {
  DisplayShape.fillStyle = color;
  DisplayShape.strokeStyle = '';
  return this.circleBody ?  Shapes.makeBall(0.2) : Shapes.makeBlock(1, 1);
};

/**
* @return {undefined}
*/
MutualAttractApp.prototype.config = function() {
  var elasticity = this.elasticity.getElasticity();
  this.mySim.cleanSlate();
  Polygon.ID = 1;
  this.advance.reset();
  this.mySim.addForceLaw(this.dampingLaw);
  this.dampingLaw.connect(this.mySim.getSimList());
  this.mySim.addForceLaw(this.gravityLaw);
  this.gravityLaw.connect(this.mySim.getSimList());
  var v = 0.6;
  for (var i=0; i<this.numBods; i++) {
    var bodyi;
    switch (i) {
     case 0: 
      bodyi = this.makeBody('green', i);
      bodyi.setPosition(new Vector(-4,  0.5),  0);
      bodyi.setVelocity(new Vector(-0.5,  1.0*v));
      break;
    case 1:
      bodyi = this.makeBody('blue', i);
      bodyi.setPosition(new Vector(-2.5,  1),  0);
      bodyi.setVelocity(new Vector(1.5*v,  -0.5*v));
      break;
    case 2:
      bodyi = this.makeBody('lightGray', i);
      bodyi.setPosition(new Vector(-0.5,  -3),  0);
      bodyi.setVelocity(new Vector(-1.5*v,  0));
      break;
    case 3:
      bodyi = this.makeBody('cyan', i);
      bodyi.setPosition(new Vector(1,  1),  0);
      bodyi.setVelocity(new Vector(0.5*v,  -0.5*v));
      break;
    case 4:
      bodyi = this.makeBody('magenta', i);
      bodyi.setPosition(new Vector(3,  -1),  0);
      break;
    case 5:
      bodyi = this.makeBody('orange', i);
      bodyi.setPosition(new Vector(5,  2),  0);
      break;
    default:
      throw new Error('too many bodies');
    }
    this.mySim.addBody(bodyi);
  }
  this.mySim.setElasticity(elasticity);
  this.mySim.getVarsList().setTime(0);
  this.mySim.saveInitialState();
  this.clock.setTime(this.mySim.getTime());
  this.clock.setRealTime(this.mySim.getTime());
  this.scriptParser.update();
};

/**
* @return {number}
*/
MutualAttractApp.prototype.getNumBods = function() {
  return this.numBods;
};

/**
* @param {number} value
*/
MutualAttractApp.prototype.setNumBods = function(value) {
  this.numBods = value;
  this.config();
  this.broadcastParameter(MutualAttractApp.en.NUMBER_BODIES);
};

/** Set of internationalized strings.
@typedef {{
  NUMBER_BODIES: string,
  OBJECTS: string
  }}
*/
MutualAttractApp.i18n_strings;

/**
@type {MutualAttractApp.i18n_strings}
*/
MutualAttractApp.en = {
  NUMBER_BODIES: 'number of bodies',
  OBJECTS: 'bodies'
};

/**
@private
@type {MutualAttractApp.i18n_strings}
*/
MutualAttractApp.de_strings = {
  NUMBER_BODIES: 'Anzahl von K\u00f6rpern',
  OBJECTS: 'K\u00f6rpern'
};


/** Set of internationalized strings.
@type {MutualAttractApp.i18n_strings}
*/
MutualAttractApp.i18n = goog.LOCALE === 'de' ? MutualAttractApp.de_strings :
    MutualAttractApp.en;

}); // goog.scope