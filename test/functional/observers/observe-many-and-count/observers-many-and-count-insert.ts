import "reflect-metadata";
import {Between} from "../../../../src";
import {Connection} from "../../../../src";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Post} from "./entity/Post";

describe("observers > many and count > on insert", function() {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["mysql"]
        });
    });
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should observe entities when new entity is inserted", ok => {
        connections.filter((connection, index) => index === 0).map(async connection => {
            let time: number = 0;

            await connection.manager.save(new Post("Hello Post"));
            connection.manager.observeManyAndCount(Post).subscribe(([entities, count]) => {
                time++;

                if (time === 1) {
                    entities.should.be.eql([{ id: 1, title: "Hello Post", active: true }]);
                    count.should.be.eql(1);
                    connection.manager.save(new Post("Second Post"));

                } else if (time === 2) {
                    entities.should.be.eql([
                        { id: 1, title: "Hello Post", active: true },
                        { id: 2, title: "Second Post", active: true },
                    ]);
                    count.should.be.eql(2);
                    connection.manager.save(new Post("Third Post"));

                } else if (time === 3) {
                    entities.should.be.eql([
                        { id: 1, title: "Hello Post", active: true },
                        { id: 2, title: "Second Post", active: true },
                        { id: 3, title: "Third Post", active: true },
                    ]);
                    count.should.be.eql(3);
                    ok();
                }
            });
        });
    });

    it("should observe entities when new entity is inserted with conditional query", ok => {
        connections.filter((connection, index) => index === 0).map(async connection => {
            let time: number = 0, lastEntities: Post[] = [];

            await connection.manager.save(new Post("Hello #1"));
            await connection.manager.save(new Post("Hello #2"));
            await connection.manager.save(new Post("Hello #3"));

            connection.manager
                .observeManyAndCount(Post, {
                    where: {
                        id: Between(3, 5)
                    }
                }).subscribe(([entities, count]) => {
                    lastEntities = entities;
                    time++;

                    if (time === 1) {
                        entities.should.be.eql([{ id: 3, title: "Hello #3", active: true }]);
                        count.should.be.eql(1);
                        connection.manager.save(new Post("Hello #4"));

                    } else if (time === 2) {
                        entities.should.be.eql([
                            { id: 3, title: "Hello #3", active: true },
                            { id: 4, title: "Hello #4", active: true },
                        ]);
                        count.should.be.eql(2);
                        connection.manager.save(new Post("Hello #5"));

                    } else if (time === 3) {
                        entities.should.be.eql([
                            { id: 3, title: "Hello #3", active: true },
                            { id: 4, title: "Hello #4", active: true },
                            { id: 5, title: "Hello #5", active: true },
                        ]);
                        count.should.be.eql(3);
                        connection.manager
                            .save(new Post("Hello #6"))
                            .then(() => {
                                time.should.be.equal(3);
                                lastEntities.should.be.eql([
                                    { id: 3, title: "Hello #3", active: true },
                                    { id: 4, title: "Hello #4", active: true },
                                    { id: 5, title: "Hello #5", active: true },
                                ]);
                                setTimeout(ok, 50);
                            });
                    }
                });
        });
    });

    it("should observe entities and preserve order when new entity is inserted with conditional query", ok => {
        connections.filter((connection, index) => index === 0).map(async connection => {
            let time: number = 0, lastEntities: Post[] = [];

            await connection.manager.save(new Post("Hello #1"));
            await connection.manager.save(new Post("Hello #2"));
            await connection.manager.save(new Post("Hello #3"));

            connection.manager
                .observeManyAndCount(Post, {
                    where: {
                        id: Between(3, 5)
                    },
                    order: {
                        title: "DESC"
                    }
                }).subscribe(([entities, count]) => {
                    lastEntities = entities;
                    time++;

                    if (time === 1) {
                        entities.should.be.eql([{ id: 3, title: "Hello #3", active: true }]);
                        connection.manager.save(new Post("Hello #4"));
                        count.should.be.eql(1);

                    } else if (time === 2) {
                        entities.should.be.eql([
                            { id: 4, title: "Hello #4", active: true },
                            { id: 3, title: "Hello #3", active: true },
                        ]);
                        connection.manager.save(new Post("Hello #5"));
                        count.should.be.eql(2);

                    } else if (time === 3) {
                        entities.should.be.eql([
                            { id: 5, title: "Hello #5", active: true },
                            { id: 4, title: "Hello #4", active: true },
                            { id: 3, title: "Hello #3", active: true },
                        ]);
                        count.should.be.eql(3);
                        connection.manager
                            .save(new Post("Hello #6"))
                            .then(() => {
                                time.should.be.equal(3);
                                lastEntities.should.be.eql([
                                    { id: 5, title: "Hello #5", active: true },
                                    { id: 4, title: "Hello #4", active: true },
                                    { id: 3, title: "Hello #3", active: true },
                                ]);
                                setTimeout(ok, 50);
                            });
                    }
                });
        });
    });

});
