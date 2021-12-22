import * as React from 'react';
import { styled } from '@mui/material/styles';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';
import PersonIcon from '@mui/icons-material/Person';
import {
    Avatar,
    Button,
    Card,
    CardActions,
    CardContent,
    CardHeader,
    Grid,
    Toolbar,
    Typography,
    useMediaQuery,
    Theme,
} from '@mui/material';
import jsonExport from 'jsonexport/dist';
import {
    ListBase,
    ListToolbar,
    ListActions,
    DateField,
    EditButton,
    PaginationLimit,
    ReferenceField,
    ReferenceInput,
    SearchInput,
    SelectInput,
    ShowButton,
    SimpleList,
    TextField,
    Title,
    downloadCSV,
    useListContext,
    useTranslate,
} from 'react-admin'; // eslint-disable-line import/no-unresolved

const PREFIX = 'CommentList';

const classes = {
    card: `${PREFIX}-card`,
    cardContent: `${PREFIX}-cardContent`,
    cardLink: `${PREFIX}-cardLink`,
    cardLinkLink: `${PREFIX}-cardLinkLink`,
    cardActions: `${PREFIX}-cardActions`,
};

// TODO jss-to-styled codemod: The Fragment root was replaced by div. Change the tag if needed.
const Root = styled(Grid)(({ theme }) => ({
    [`& .${classes.card}`]: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
    },

    [`& .${classes.cardContent}`]: theme.typography.body1,

    [`& .${classes.cardLink}`]: {
        ...theme.typography.body1,
        flexGrow: 1,
    },

    [`& .${classes.cardLinkLink}`]: {
        display: 'inline',
    },

    [`& .${classes.cardActions}`]: {
        justifyContent: 'flex-end',
    },
}));

const commentFilters = [
    <SearchInput source="q" alwaysOn />,
    <ReferenceInput source="post_id" reference="posts">
        <SelectInput optionText="title" />
    </ReferenceInput>,
];

const exporter = (records, fetchRelatedRecords) =>
    fetchRelatedRecords(records, 'post_id', 'posts').then(posts => {
        const data = records.map(record => {
            const { author, ...recordForExport } = record; // omit author
            recordForExport.author_name = author.name;
            recordForExport.post_title = posts[record.post_id].title;
            return recordForExport;
        });
        const headers = [
            'id',
            'author_name',
            'post_id',
            'post_title',
            'created_at',
            'body',
        ];

        jsonExport(data, { headers }, (error, csv) => {
            if (error) {
                console.error(error);
            }
            downloadCSV(csv, 'comments');
        });
    });

const CommentPagination = () => {
    const { isLoading, data, page, perPage, total, setPage } = useListContext();
    const translate = useTranslate();
    const nbPages = Math.ceil(total / perPage) || 1;
    if (!isLoading && (total === 0 || (data && !data.length))) {
        return <PaginationLimit />;
    }

    return (
        nbPages > 1 && (
            <Toolbar>
                {page > 1 && (
                    <Button
                        color="primary"
                        key="prev"
                        onClick={() => setPage(page - 1)}
                    >
                        <ChevronLeft />
                        &nbsp;
                        {translate('ra.navigation.prev')}
                    </Button>
                )}
                {page !== nbPages && (
                    <Button
                        color="primary"
                        key="next"
                        onClick={() => setPage(page + 1)}
                    >
                        {translate('ra.navigation.next')}&nbsp;
                        <ChevronRight />
                    </Button>
                )}
            </Toolbar>
        )
    );
};

const CommentGrid = () => {
    const { data } = useListContext();
    const translate = useTranslate();

    if (!data) return null;
    return (
        <Root spacing={2} container>
            {data.map(record => (
                <Grid item key={record.id} sm={12} md={6} lg={4}>
                    <Card className={classes.card}>
                        <CardHeader
                            className="comment"
                            title={
                                <TextField
                                    record={record}
                                    source="author.name"
                                />
                            }
                            subheader={
                                <DateField
                                    record={record}
                                    source="created_at"
                                />
                            }
                            avatar={
                                <Avatar>
                                    <PersonIcon />
                                </Avatar>
                            }
                        />
                        <CardContent className={classes.cardContent}>
                            <TextField record={record} source="body" />
                        </CardContent>
                        <CardContent className={classes.cardLink}>
                            <Typography component="span" variant="body2">
                                {translate('comment.list.about')}&nbsp;
                            </Typography>
                            <ReferenceField
                                record={record}
                                source="post_id"
                                reference="posts"
                            >
                                <TextField
                                    source="title"
                                    className={classes.cardLinkLink}
                                />
                            </ReferenceField>
                        </CardContent>
                        <CardActions className={classes.cardActions}>
                            <EditButton record={record} />
                            <ShowButton record={record} />
                        </CardActions>
                    </Card>
                </Grid>
            ))}
        </Root>
    );
};

CommentGrid.defaultProps = {
    data: {},
    ids: [],
};

const CommentMobileList = () => (
    <SimpleList
        primaryText={record => record.author.name}
        secondaryText={record => record.body}
        tertiaryText={record =>
            new Date(record.created_at).toLocaleDateString()
        }
        leftAvatar={() => <PersonIcon />}
    />
);

const CommentList = () => (
    <ListBase perPage={6} exporter={exporter}>
        <ListView />
    </ListBase>
);

const ListView = () => {
    const isSmall = useMediaQuery<Theme>(theme => theme.breakpoints.down('md'));
    const { defaultTitle } = useListContext();
    return (
        <Root>
            <Title defaultTitle={defaultTitle} />
            <ListToolbar filters={commentFilters} actions={<ListActions />} />
            {isSmall ? <CommentMobileList /> : <CommentGrid />}
            <CommentPagination />
        </Root>
    );
};

export default CommentList;