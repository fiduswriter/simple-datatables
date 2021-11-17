const columnData = [
    {
        // Select the first column ...
        select: 0,
        cellClass: 'text-left bg-pink-800 group-hover:bg-pink-900',
        headerClass: 'bg-pink-700',
        name: 'id'
    }
]
const datatable_datas = {
    columns : [
        {name : 'id'},
        {name : 'name'}
    ],
    order: 'name',
    orderDirection: 'asc',
    limit : 25,
};
const csrfToken = "{{ csrf_token() }}";
const datatable_url = "{{route('library.list')}}";
const datatable_url_options = {
    headers: {
        "Content-Type": "application/json",
        "X-CSRF-TOKEN": "{{ csrf_token() }}",
    },
    cache: 'no-cache',
    method: "POST",
    body: JSON.stringify(datatable_datas)
};
fetch(datatable_url, datatable_url_options)
    .then(response => response.json())
    .then(data => {
        let data_ = data.data.data;
        if (!data_.length) {
            return
        }
        let table = new DataTable(".table", {
            columns: columnData??null,
            perPageSelect: [25, 50, 100],
            perPage: 25,
            actions: true,
            actionsTemplate:
                `<div class="flex justify-end gap-2">
                    <button
                        class="modal-open text-xs bg-transparent border border-green-500 text-green-500 hover:bg-green-500 hover:text-white text-center py-1 px-1.5 rounded"
                        data-modal-route-name="{{route('fe.users.becomeAuthorForm')}}"
                        data-modal-route-method="POST"
                        data-modal-route-token="{{csrf_token()}}"
                        data-modal-action="send"
                        data-modal-type="remote"
                    ><em class="fas fa-plus fa-fw"></em></button>
                </div>`,
            pagerClasses: {
                liClasses: ['bg-gray-900', 'border-gray-800', 'text-gray-500', 'hover:bg-gray-50', 'relative', 'inline-flex', 'items-center', 'border', 'text-sm', 'font-medium'],
                liClassesEllispsis: ['relative', 'inline-flex', 'items-center', 'border', 'border-gray-800', 'bg-gray-900', 'text-sm', 'font-medium', 'text-gray-700'],
                liClassesPrev: ['relative', 'inline-flex', 'items-center', 'rounded-l-md', 'border', 'border-gray-800', 'bg-gray-900', 'text-sm', 'font-medium', 'text-gray-500', 'hover:bg-gray-50'],
                liClassesNext: ['relative', 'inline-flex', 'items-center', 'rounded-r-md', 'border', 'border-gray-800', 'bg-gray-900', 'text-sm', 'font-medium', 'text-gray-500', 'hover:bg-gray-50'],
            },
            data: {
                headings: Object.keys(data_[0]),
                data: data_.map(item => Object.values(item)),
            },
            pageOptions : data.data,
            remoteDatas: {
                token : csrfToken??null,
                url : datatable_url??null,
                url_options : datatable_url_options??null,
            }
        })
    });