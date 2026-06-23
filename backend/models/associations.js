const User           = require('./User');
const Admin          = require('./Admin');
const Trip           = require('./Trip');
const Attraction     = require('./Attraction');
const Interest       = require('./Interest');
const UserInterest   = require('./UserInterest');
const TripAttraction = require('./TripAttraction');

// ── User <-> Trip (One-to-Many) ───────────────────────────────────────────
User.hasMany(Trip,   { foreignKey: 'userId' });
Trip.belongsTo(User, { foreignKey: 'userId' });

// ── User <-> Interest (Many-to-Many through UserInterest) ────────────────
User.belongsToMany(Interest, { through: UserInterest, foreignKey: 'userId',     otherKey: 'interestId' });
Interest.belongsToMany(User, { through: UserInterest, foreignKey: 'interestId', otherKey: 'userId'     });

// Direct associations on the junction model so we can do
// UserInterest.findAll({ include: [Interest] }) in the controller.
UserInterest.belongsTo(Interest, { foreignKey: 'interestId' });
UserInterest.belongsTo(User,     { foreignKey: 'userId'     });
Interest.hasMany(UserInterest,   { foreignKey: 'interestId' });
User.hasMany(UserInterest,       { foreignKey: 'userId'     });

// ── Trip <-> Attraction (Many-to-Many through TripAttraction) ────────────
Trip.belongsToMany(Attraction, { through: TripAttraction, foreignKey: 'tripId',       otherKey: 'attractionId' });
Attraction.belongsToMany(Trip, { through: TripAttraction, foreignKey: 'attractionId', otherKey: 'tripId'       });

// Direct associations on the junction model so we can do
// Trip.findByPk({ include: [Attraction] }) and access TripAttraction fields.
TripAttraction.belongsTo(Attraction, { foreignKey: 'attractionId' });
TripAttraction.belongsTo(Trip,       { foreignKey: 'tripId'       });

module.exports = { User, Admin, Trip, Attraction, Interest, UserInterest, TripAttraction };
