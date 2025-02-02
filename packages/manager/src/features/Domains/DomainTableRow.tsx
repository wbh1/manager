import { Domain, DomainStatus } from '@linode/api-v4/lib/domains';
import * as React from 'react';
import { Link } from 'react-router-dom';
import Hidden from 'src/components/core/Hidden';
import { makeStyles, Theme } from 'src/components/core/styles';
import DateTimeDisplay from 'src/components/DateTimeDisplay';
import StatusIcon from 'src/components/StatusIcon';
import TableCell from 'src/components/TableCell';
import TableRow from 'src/components/TableRow';
import ActionMenu, { Handlers } from './DomainActionMenu';
import { getDomainDisplayType } from './domainUtils';

const useStyles = makeStyles((theme: Theme) => ({
  button: {
    ...theme.applyLinkStyles,
  },
  labelStatusWrapper: {
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'center',
    whiteSpace: 'nowrap',
  },
  statusCell: {
    whiteSpace: 'nowrap',
  },
}));

type CombinedProps = Domain & Handlers;

const DomainTableRow: React.FC<CombinedProps> = (props) => {
  const {
    domain,
    id,
    type,
    status,
    onDisableOrEnable,
    updated,
    onClone,
    onRemove,
    onEdit,
  } = props;

  const classes = useStyles();

  return (
    <TableRow
      key={id}
      data-qa-domain-cell={domain}
      className="fade-in-table"
      ariaLabel={`Domain ${domain}`}
    >
      <TableCell data-qa-domain-label>
        <div className={classes.labelStatusWrapper}>
          {type !== 'slave' ? (
            <Link to={`/domains/${id}`} tabIndex={0}>
              {domain}
            </Link>
          ) : (
            <button
              className={classes.button}
              onClick={() => props.onEdit(domain, id)}
            >
              {domain}
            </button>
          )}
        </div>
      </TableCell>
      <TableCell className={classes.statusCell} data-qa-domain-status>
        <StatusIcon status={domainStatusToIconStatus(status)} />
        {humanizeDomainStatus(status)}
      </TableCell>
      <Hidden xsDown>
        <TableCell data-qa-domain-type>{getDomainDisplayType(type)}</TableCell>
        <TableCell data-qa-domain-lastmodified>
          <DateTimeDisplay value={updated} />
        </TableCell>
      </Hidden>
      <TableCell actionCell>
        <ActionMenu
          domain={domain}
          onDisableOrEnable={onDisableOrEnable}
          id={id}
          type={type}
          onRemove={onRemove}
          onClone={onClone}
          status={status}
          onEdit={onEdit}
        />
      </TableCell>
    </TableRow>
  );
};

const humanizeDomainStatus = (status: DomainStatus) => {
  switch (status) {
    case 'active':
      return 'Active';
    case 'disabled':
      return 'Disabled';
    case 'edit_mode':
      return 'Edit Mode';
    case 'has_errors':
      return 'Error';
    default:
      return 'Unknown';
  }
};

const domainStatusToIconStatus = (status: DomainStatus) => {
  switch (status) {
    case 'active':
      return 'active';
    case 'disabled':
      return 'inactive';
    case 'edit_mode':
      return 'inactive';
    case 'has_errors':
      return 'error';
    default:
      return 'inactive';
  }
};

export default React.memo(DomainTableRow);
