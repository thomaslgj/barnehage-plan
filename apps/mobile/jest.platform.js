// This file runs FIRST to set up Platform before anything else
global.Platform = {
  OS: 'ios',
  Version: 14,
  select: jest.fn((specifics) => specifics.ios || specifics.default),
};
