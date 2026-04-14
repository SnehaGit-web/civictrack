jest.mock('pg', () => {
  const mockQuery = jest.fn().mockResolvedValue({ rows: [], rowCount: 0 });
  const mockOn = jest.fn();
  const mockEnd = jest.fn().mockResolvedValue(undefined);

  return {
    Pool: jest.fn().mockImplementation(() => ({
      query: mockQuery,
      on: mockOn,
      end: mockEnd,
    })),
  };
});