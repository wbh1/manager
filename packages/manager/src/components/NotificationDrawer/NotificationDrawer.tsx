import * as React from 'react';
import { useDispatch } from 'react-redux';
import { makeStyles, Theme } from 'src/components/core/styles';
import Drawer from 'src/components/Drawer';
import useDismissibleNotifications from 'src/hooks/useDismissibleNotifications';
import useNotifications from 'src/hooks/useNotifications';
import usePrevious from 'src/hooks/usePrevious';
import { markAllSeen } from 'src/store/events/event.request';
import { ThunkDispatch } from 'src/store/types';
import { NotificationData } from 'src/features/NotificationCenter/NotificationData/useNotificationData';
import Events from 'src/features/NotificationCenter/Events';
import Notifications from 'src/features/NotificationCenter/Notifications';

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    '& .MuiDrawer-paper': {
      [theme.breakpoints.up('md')]: {
        width: 620,
      },
      overflowX: 'hidden',
    },
  },
  notificationSectionContainer: {
    '& > div': {
      marginTop: theme.spacing(3),
      marginBottom: theme.spacing(3),
    },
  },
  actionHeader: {
    display: 'flex',
    paddingBottom: theme.spacing(),
    justifyContent: 'flex-end',
    borderBottom: `solid 1px ${theme.palette.divider}`,
    marginBottom: theme.spacing(3),
  },
}));

export interface Props {
  data: NotificationData;
  open: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<Props> = (props) => {
  const { data, open, onClose } = props;
  const classes = useStyles();
  const { dismissNotifications } = useDismissibleNotifications();
  const notifications = useNotifications();
  const dispatch = useDispatch<ThunkDispatch>();
  const { eventNotifications, formattedNotifications } = data;

  const wasOpen = usePrevious(open);

  React.useEffect(() => {
    if (wasOpen && !open) {
      // User has closed the drawer.
      dispatch(markAllSeen());
      dismissNotifications(notifications, { prefix: 'notificationDrawer' });
    }
  }, [dismissNotifications, notifications, dispatch, open, wasOpen]);

  return (
    <Drawer open={open} onClose={onClose} title="" className={classes.root}>
      <div className={classes.notificationSectionContainer}>
        <Notifications
          notificationsList={formattedNotifications}
          onClose={onClose}
        />
        <Events events={eventNotifications} onClose={onClose} />
      </div>
    </Drawer>
  );
};

export default React.memo(NotificationDrawer);
