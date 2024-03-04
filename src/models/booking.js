module.exports = (sequelize, DataTypes) => {
  const Booking = sequelize.define("booking", {
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    customerName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    customerEmail: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    bookingDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    bookingType: {
      type: DataTypes.ENUM("FullDay", "HalfDay", "Custom"),
      allowNull: false,
    },
    bookingSlot: {
      type: DataTypes.ENUM("FirstHalf", "SecondHalf"),
      allowNull: true,
    },
    bookingTime: {
      type: DataTypes.TIME,
      allowNull: true,
      
    },
  });
  return Booking;
};
