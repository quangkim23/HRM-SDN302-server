class GetManyQueryResponse {
    constructor(pageIndex, pageSize, totalCount, sort, items){
        this.pageIndex = pageIndex,
        this.pageSize = pageSize,
        this.totalCount = totalCount,
        this.sort = sort,
        this.items = items
    }
}


module.exports = GetManyQueryResponse;