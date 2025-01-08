const getDateAndGroupFormat = async (filter) => {
  const now = new Date();
  let startDate, groupFormat;

  switch (filter) {
    case 'day':
      startDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 6
      );
      groupFormat = { $dateToString: { format: '%Y-%m-%d', date: '$date' } };
      break;

    case 'week':
      startDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 7 * 6
      );
      groupFormat = {
        $dateToString: {
          format: '%Y-%m-%d',
          date: {
            $dateFromParts: {
              isoWeekYear: { $isoWeekYear: '$date' },
              isoWeek: { $isoWeek: '$date' },
              isoDayOfWeek: { $literal: 1 },
            },
          },
        },
      };
      break;

    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      groupFormat = { $dateToString: { format: '%Y-%m-01', date: '$date' } };
      break;

    default:
      throw new Error('Invalid filter. Use "day", "week", or "month".');
  }

  return { startDate, groupFormat, now };
};

module.exports = { getDateAndGroupFormat };
